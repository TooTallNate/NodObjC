module.exports = (function() {
  /**
   * The 'id' function is essentially the "base class" for all Objective-C
   * objects that get passed around JS-land.
   */

  /*!
   * Module dependencies.
   */

  var core  = require('./core')
    , assert = require('assert')
    , exception = require('./exception')
    , Class = require('./class')
    , KEY = new Buffer(1);

  /*!
   * Struct used by msgSendSuper().
   */
  var objc_super = core.Struct({
    'receiver': 'pointer',
    'class': 'pointer'
  });

  function ID(pointer) {
    console.assert(pointer !== 0 && pointer.address() !== 0, 'Construcotr ID cannot be null.');
    this.pointer = pointer;
  }

  /**
   * Wraps up a pointer that is expected to be a compatible Objective-C
   * object that can recieve messages. This function returns a cached version of the
   * wrapped function after the first time it is invoked on a given Pointer, using
   * Objective-C's internal association map for objects.
   *
   * @api private
   */

  ID.wrap = function(pointer) {
    console.assert(pointer !== 0 && pointer.address() !== 0, 'pointer passed in was null ', pointer, pointer.address());
    var rtn = null;
    var p = core.objc_getAssociatedObject(pointer, KEY);
    if (p.isNull()) {
      var id = new ID(pointer);
      rtn = function() {
        var args = [];
        var sel = core.parseArgs(arguments,args);
        return id.msgSend(sel,args);
      }
      rtn.pointer = pointer;
      pointer._type = '@';
      rtn.__proto__ = ID.prototype;

      // Store the wrapped instance internally
      var r = core.REF.alloc('Object');
      // don't call free() automatically when ref gets GC'd
      // TODO: we're gonna have to free this pointer someday!
      // XXX: use node-weak to get a callback when the wrapper is GC'd
      r.free = false;
      r.writeObject(rtn, 0);
      core.objc_setAssociatedObject(pointer, KEY, r, 0);
    } else {
      rtn = p.readObject(0);
    }
    console.assert(rtn.pointer.hexAddress() == pointer.hexAddress(), 'rtn is: ',rtn.pointer, 'pointer is: ',pointer);
    return rtn;
  }

  ID.prototype.msgSendHelper = function(msgtypes,sel,args) {
    var argTypes = msgtypes[1];
    var msgSendFunc = core.get_objc_msgSend(msgtypes);
    var unwrappedArgs = core.unwrapValues([this, sel].concat(args), argTypes);
    try {
      // Process the return value into a wrapped value if needed
      return core.wrapValue(msgSendFunc.apply(null, unwrappedArgs), msgtypes[0]);
    } catch (e) {
      if (!e.hasOwnProperty('stack')) throw exception.wrap(e);
      else throw e;
    }
  }

  ID.prototype.msgSendSuperHelper = function(msgtypes, sel, args) {
    var os = new objc_super;
    os.receiver = this.pointer;
    os.class = this.getClass().getSuperclass().pointer;
    
    var argTypes = msgtypes[1];
    var msgSendSuperFunc = core.get_objc_msgSendSuper(msgtypes);
    var unwrappedArgs = core.unwrapValues([os, sel].concat(args), argTypes);
    var rtn;
    
    try {
      rtn = msgSendSuperFunc.apply(null, unwrappedArgs);
    } catch (e) {
      if (!e.hasOwnProperty('stack')) throw exception.wrap(e);
      throw err;
    }
    // Process the return value into a wrapped value if needed
    return core.wrapValue(rtn, msgtypes[0]);
  }

  ID.prototype.msgSendSuperStructHelper = function(structRaw,msgtypes,sel,args) {
    var os = new objc_super;
    os.receiver = this.pointer;
    os.class = this.getClass().getSuperclass().pointer;

    var structNew = new structRaw();
    var structType = msgtypes[0];

    msgtypes[1].splice(0, 0, structNew);
    msgtypes[0] = 'v';

    var argTypes = msgtypes[1];
    var msgSendFunc = core.get_objc_msgSend_stret(msgtypes);
    var unwrappedArgs = [structNew.ref()].concat(core.unwrapValues([os, sel].concat(args), argTypes.slice(1)));
    
    try {
      var rtn = msgSendFunc.apply(null, unwrappedArgs)
    } catch (e) {
      if (!e.hasOwnProperty('stack')) throw exception.wrap(e);
      else throw e;
    }
    // Process the return value into a wrapped value if needed
    delete structNew._type;
    var temp = core.wrapValue(structNew, structRaw);
    temp._type = structType;
    return temp;
  }

  ID.prototype.msgSendStructHelper = function(structRaw,msgtypes,sel,args) {
    var structNew = new structRaw();
    var structType = msgtypes[0];

    msgtypes[1].splice(0, 0, structNew);
    msgtypes[0] = 'v';

    var argTypes = msgtypes[1];
    var msgSendFunc = core.get_objc_msgSend_stret(msgtypes);
    var unwrappedArgs = [structNew.ref()].concat(core.unwrapValues([this, sel].concat(args), argTypes.slice(1)));
    
    try {
      var rtn = msgSendFunc.apply(null, unwrappedArgs)
    } catch (e) {
      if (!e.hasOwnProperty('stack')) throw exception.wrap(e);
      else throw e;
    }
    return structNew;
  }

  /**
   * Calls `objc_msgSendSuper()` on the underlying Objective-C object.
   */

  ID.prototype.msgSendSuper = function(sel, args) {
    var msgtypes = this.getTypes(sel, args);
    var structRaw;
    if(structure.isStruct(msgtypes[0]) && (structRaw = structure.getStruct(msgtypes[0])) && (structRaw.size > 16))
      return this.msgSendSuperStructHelper(structRaw, msgtypes, sel, args);
    else
      return this.msgSendSuperHelper(msgtypes, sel, args);
  }

  /**
   * A very important function that *does the message sending* between
   * Objective-C objects. When you do `array('addObject', anObject)`, this
   * `msgSend` function is the one that finally gets called to do the dirty work.
   *
   * This function accepts a String selector as the first argument, and an Array
   * of (wrapped) values that get passed to the the message. This function takes
   * care of unwrapping the passed in arguments and wrapping up the result value,
   * if necessary.
   */
  ID.prototype.msgSend = function(sel, args) {
    var msgtypes = this.getTypes(sel, args);
    var structRaw;
    if(core.Types.isStruct(msgtypes[0]) && (structRaw = core.Types.getStruct(msgtypes[0])) && (structRaw.size > 16))
      return this.msgSendStructHelper(structRaw,msgtypes,sel,args);
    else
      return this.msgSendHelper(msgtypes,sel,args);
  }

  /**
   * Like regular message sending, but invokes the method implementation on the
   * object's "superclass" instead. This is the equivalent of what happens when the
   * Objective-C compiler encounters the `super` keyword:
   *
   * ``` objectivec
   * self = [super init];
   * ```
   *
   * To do the equivalent using NodObjC you call `super()`, as shown here:
   *
   * ``` js
   * self = self.super('init')
   * ```
   */
  ID.prototype.super = function() {
    var args = [];
    var sel = parseArgs(arguments, args);
    return this.msgSendSuper(sel, args);
  }

  /**
   * Accepts a SEL and queries the current object for the return type and
   * argument types for the given selector. If current object does not implment
   * that selector, then check the superclass, and repeat recursively until
   * a subclass that responds to the selector is found, or until the base class
   * is found.
   *
   * @api private
   */
  ID.prototype.getTypes = function(sel, args) {
    var c = this.getClass();
    var t = c.getTypesClass(sel, this.isClass);
    if (!t) {
      // Unknown selector being send to object. This *may* still be valid, we
      // assume all args are type 'id' and return is 'id'.
      t = [ '@', [ '@', ':', ].concat(args.map(function () { return '@' })) ];
    }
    return t;
  }

  /**
   * Retrieves the wrapped Class instance for this object.
   *
   * @return {Class} Class instance for this object.
   * @api public
   */
  // Decouple this...
  ID.prototype.getClass = function() { 
    var rtn = core.object_getClass(this.pointer);
    console.assert(rtn !== 0 && rtn.address() !== 0, 'ID.getClass had empty pointer', rtn, rtn.address());
    return Class.wrap(rtn); 
  }

  /**
   * Calls 'object_getClassName()' on this object.
   *
   * @return {String} The class name as a String.
   * @api public
   */
  ID.prototype.getClassName = function() { return core.object_getClassName(this.pointer); }

  /**
   * Dynamically changes the object's Class.
   */
  //TODO: Decouple this...
  ID.prototype.setClass = function(newClass) { return Class.wrap(core.object_setClass(this.pointer, newClass.pointer)); }

  /**
   * Walks up the inheritance chain and returns an Array of Strings of
   * superclasses.
   */
  ID.prototype.ancestors = function() {
    var rtn=[], c=this.getClass();
    while (c) {
      rtn.push(c.getName());
      c = c.getSuperclass();
    }
    return rtn;
  }

  /**
   * Getter/setter function for instance variables (ivars) of the object,
   * If just a name is passed in, then this function gets the ivar current value.
   * If a name and a new value are passed in, then this function sets the ivar.
   */
  ID.prototype.ivar = function(name, value) {
    // TODO: Add support for passing in a wrapped Ivar instance as the `name`
    if (arguments.length > 1) {
      // setter
      var ivar = this.isClass ? this.getClassVariable(name) : this.getClass().getInstanceVariable(name);
      var unwrapped = core.unwrapValue(value, ivar.getTypeEncoding());
      return core.object_setIvar(this.pointer, ivar.pointer, unwrapped);
    } else {
      var ptr = new Buffer(core.REF.sizeof.pointer);
      var ivar = core.object_getInstanceVariable(this.pointer, name, ptr);
      return core.wrapValue(ptr.readPointer(0), core.ivar_getTypeEncoding(ivar));
    }
  }

  /**
   * Returns an Array of Strings of the names of the ivars that the current object
   * contains. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` argument.
   */
  ID.prototype.ivars = function(maxDepth, sort) {
    var rtn=[], c=this.getClass(), md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      var is=c.getInstanceVariables(), i=is.length;
      while (i--) if (!~rtn.indexOf(is[i])) rtn.push(is[i]);
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  }

  /**
   * Returns an Array of Strings of the names of methods that the current object
   * will respond to. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` number argument.
   */
  ID.prototype.methods = function(maxDepth, sort) {
    var rtn=[], c=this.getClass(), md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      var ms=c.getInstanceMethods(), i=ms.length;
      while (i--) if (!~rtn.indexOf(ms[i])) rtn.push(ms[i]);
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  }

  /**
   * Returns a **node-ffi** pointer pointing to this object. This is a convenience
   * function for methods that take pointers to objects (i.e. `NSError**`).
   *
   * @return {Pointer} A pointer to this object.
   */
  ID.prototype.ref = function() { return this.pointer.ref(); }

  /**
   * The overidden `toString()` function proxies up to the real Objective-C object's
   * `description` method. In Objective-C, this is equivalent to:
   *
   * ``` objectivec
   * [[id description] UTF8String]
   * ```
   */
  ID.prototype.toString = function() { return this('description')('UTF8String'); }

  /*!
   * Custom inspect() function for `util.inspect()`.
   */
  ID.prototype.inspect = function() { return this.toString();  }

  return ID;
})();
