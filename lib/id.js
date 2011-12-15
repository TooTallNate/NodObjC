
/**
 * The 'id' function is essentially the "base class" for all Objective-C
 * objects that get passed around JS-land.
 */

/*!
 * Module exports.
 */

exports.wrap = wrap

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC')
  , proto = exports.proto = Object.create(Function.prototype)
  , core  = require('./core')
  , Class = require('./class')
  , types = require('./types')
  , SEL   = require('./sel')
  , exception = require('./exception')
  , assert = require('assert')

/*!
 * An arbitrary "key" pointer we use for storing the JS-wrap instance reference
 * into the ObjC object's internal weak map via `objc_getAssociatedObject()`.
 */

var KEY = new core.Pointer(1)

/**
 * Wraps up a pointer that is expected to be a compatible Objective-C
 * object that can recieve messages. This function returns a cached version of the
 * wrapped function after the first time it is invoked on a given Pointer, using
 * Objective-C's internal association map for objects.
 *
 * @api private
 */

function wrap (pointer) {
  debug('id#wrap(%d)', pointer.address)
  var rtn = null
    , p = core.objc_getAssociatedObject(pointer, KEY)
  if (p.isNull()) {
    rtn = createFunctionWrapper(pointer)
    // Store the wrapped instance internally
    var ref = new core.Pointer(core.TYPE_SIZE_MAP.Object)
    // don't call free() automatically when ref gets GC'd
    // TODO: we're gonna have to free this pointer someday!
    // XXX: use node-weak to get a callback when the wrapper is GC'd
    ref.free = false
    ref.putObject(rtn)
    core.objc_setAssociatedObject(pointer, KEY, ref, 0)
  } else {
    debug('returning cached associated instance')
    rtn = p.getObject()
  }
  //assert.equal(rtn.pointer.address, pointer.address)
  return rtn
}

/*!
 * Internal function that essentially "creates" a new Function instance wrapping
 * the given pointer. The function's implementation is the "id()" function below,
 *
 * XXX: Maybe use `Function.create()` from my `create` module here (benchmark)???
 *
 * @api private
 */

function createFunctionWrapper (pointer) {
  debug('createFunctionWrapper(%d)', pointer.address)

  // This 'id' function is syntax sugar around the msgSend function attached to
  // it. 'msgSend' is expecting the selector first, an Array of args second, so
  // this function just massages it into place and returns the result.
  function id () {
    var args = []
      , sel
    if (arguments.length === 1) {
      var arg = arguments[0]
      if (arg.constructor.name == 'String') {
        sel = arg
      } else {
        sel = []
        Object.keys(arg).forEach(function (s) {
          sel.push(s)
          args.push(arg[s])
        })
        sel.push('')
        sel = sel.join(':')
      }
    } else {
      sel = []
      var len = arguments.length
      for (var i=0; i<len; i+=2) {
        sel.push(arguments[i])
        args.push(arguments[i+1])
      }
      sel.push('')
      sel = sel.join(':')
    }
    return id.msgSend(sel, args)
  }

  // Set the "type" on the pointer. This is used by 'ref()' and 'unref()'.
  pointer._type = '@'
  // Save a reference to the pointer for use by the prototype functions
  id.pointer = pointer
  // Morph into a MUTANT FUNCTION FREAK!!1!
  id.__proto__ = proto
  return id
}


/**
 * A very important function that *does the message sending* between
 * Objective-C objects. When you do `array('addObject', anObject)`, this
 * `msgSend` function is the one that finally gets called to do the dirty work.
 *
 * This function accepts a String selector as the first argument, and an Array
 * of (wrapped) values that get passed to the the message. This function takes
 * care of unwrapping the passing in arguments an wrapping up the result value,
 * if necessary.
 *
 * If you wanted to monkey-patch *every* message that got sent out from an
 * object though NodObjC, this is the place to do it.
 *
 * @api private
 */

proto.msgSend = function msgSend (sel, args) {
  debug('sending message:', sel, args)
  var types = this._getTypes(sel, args)
    , argTypes = types[1]
    , msgSendFunc = core.get_objc_msgSend(types)
    , unwrappedArgs = core.unwrapValues([this, sel].concat(args), argTypes)
    , rtn
  try {
    rtn = msgSendFunc.apply(null, unwrappedArgs)
  } catch (e) {
    throw exception.wrap(e)
  }
  // Process the return value into a wrapped value if needed
  return core.wrapValue(rtn, types[0])
}

/**
 * Accepts a SEL and queries the current object for the return type and
 * argument types for the given selector. If current object does not implment
 * that selector, then check the superclass, and repeat recursively until
 * a subclass that responds to the selector is found, or until the base class
 * is found.
 *
 * TODO: Just merge this logic with `msgSend()`? It's not used anywhere else
 *
 * @api private
 */

proto._getTypes = function getTypes (sel, args) {
  var c = this.getClass()
    , t = c._getTypesClass(sel, this.isClass)
  if (!t) {
    // Unknown selector being send to object. This *may* still be valid, we
    // assume all args are type 'id' and return is 'id'.
    debug('unknown selector being sent:', sel)
    t = [ '@', [ '@', ':', ].concat(args.map(function () { return '@' })) ]
  }
  return t
}

/**
 * Retrieves the wrapped Class instance for this object.
 */

proto.getClass = function getClass () {
  return Class.wrap(this._getClassPointer())
}

/**
 * Returns the node-ffi pointer for the class of this object.
 */

proto._getClassPointer = function getClassPointer () {
  return core.object_getClass(this.pointer)
}

/**
 * Calls 'object_getClassName()' on this object.
 */

proto.getClassName = function getClassName () {
  return core.object_getClassName(this.pointer)
}

/**
 * Dynamically changes the object's Class.
 */

proto.setClass = function setClass (newClass) {
  return Class.wrap(core.object_setClass(this.pointer, newClass.pointer))
}

/**
 * Walks up the inheritance chain and returns an Array of Strings of
 * superclasses.
 */

proto.ancestors = function ancestors () {
  var rtn = []
    , c = this.getClass()
  while (c) {
    rtn.push(c.getName())
    c = c.getSuperclass()
  }
  return rtn
}

/**
 * Getter/setter function for instance variables (ivars) of the object,
 * If just a name is passed in, then this function gets the ivar current value.
 * If a name and a new value are passed in, then this function sets the ivar.
 */

proto.ivar = function ivar (name, value) {
  // TODO: Add support for passing in a wrapped Ivar instance as the `name`
  if (arguments.length > 1) {
    // setter
    debug('setting ivar:', name, value)
    var ivar = this.isClass
             ? this.getClassVariable(name)
             : this.getClass().getInstanceVariable(name)
      , unwrapped = core.unwrapValue(value, ivar.getTypeEncoding())
    return core.object_setIvar(this.pointer, ivar.pointer, unwrapped)
  } else {
    // getter
    debug('getting ivar:', name)
    var ptr = new core.Pointer(core.TYPE_SIZE_MAP.pointer)
      , ivar = core.object_getInstanceVariable(this.pointer, name, ptr)
    return core.wrapValue(ptr.getPointer(), core.ivar_getTypeEncoding(ivar))
  }
}

/**
 * Returns an Array of Strings of the names of the ivars that the current object
 * contains. This function can iterate through the object's superclasses
 * recursively, if you specify a 'maxDepth' argument.
 */

proto.ivars = function ivars (maxDepth, sort) {
  var rtn = []
    , c = this.getClass()
    , md = maxDepth || 1
    , depth = 0
  while (c && depth++ < md) {
    var is = c.getInstanceVariables()
      , i = is.length
    while (i--) {
      if (!~rtn.indexOf(is[i])) rtn.push(is[i])
    }
    c = c.getSuperclass()
  }
  return sort === false ? rtn : rtn.sort()
}

/**
 * Returns an Array of Strings of the names of methods that the current object
 * will respond to. This function can iterate through the object's superclasses
 * recursively, if you specify a 'maxDepth' number argument.
 */

proto.methods = function methods (maxDepth, sort) {
  var rtn = []
    , c = this.getClass()
    , md = maxDepth || 1
    , depth = 0
  while (c && depth++ < md) {
    var ms = c.getInstanceMethods()
      , i = ms.length
    while (i--) {
      if (!~rtn.indexOf(ms[i])) rtn.push(ms[i])
    }
    c = c.getSuperclass()
  }
  return sort === false ? rtn : rtn.sort()
}

/**
 * Returns a **node-ffi** pointer pointing to this object. This is a convenience
 * function for methods that take pointers to objects (i.e. `NSError**`).
 *
 * @return {Pointer} A pointer to this object.
 */

proto.ref = function ref () {
  debug('id#ref()')
  var ptr = this.pointer.ref()
  return ptr
}


/**
 * The overidden `toString()` function proxies up to the real Objective-C object's
 * `description` method. In Objective-C, this is equivalent to:
 *
 *     [[id description] UTF8String]
 */

proto.toString = function toString () {
  return this('description')('UTF8String')
}

proto.inspect = function inspect () {
  return this.toString()
}
