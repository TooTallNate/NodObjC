module.exports = ID;

/*!
 * Module dependencies.
 */

var ref = require('ref');
var Struct = require('ref-struct');
var createFunction = require('function-class');
var invoke = require('function-class/invoke');

var core  = require('./core');
var inherits = require('./inherits');
var Exception = require('./exception');

/**
 * The 'id' function is essentially the "base class" for all Objective-C
 * objects that get passed around JS-land.
 */

function ID (pointer) {
  if (typeof this !== 'function') return createFunction(null, 0, ID, arguments);

  var objClass = core.object_getClass(pointer);

  // This is absolutely necessary, otherwise we'll seg fault if a user passes in
  // a simple type or specifies an object on a class that takes a simple type.
  if (!objClass || ref.isNull(objClass)) {
    throw new TypeError('An abstract class or delegate implemented a method ' +
                        'that takes an ID (object), but a simple type or ' +
                        'structure (such as NSRect) was passed in');
  }

  this.pointer = pointer;
  this.msgCache = [];

  this[invoke] = function () {
    return this.msgSend(arguments, false, this);
  }.bind(this);
}
inherits(ID, Function);

ID.prototype.type = '@';

/**
 * Calls 'object_getClassName()' on this object.
 *
 * @return {String} The class name as a String.
 * @api public
 */
ID.prototype.getClassName = function() {
  return core.object_getClassName(this.pointer);
};

/**
 * Dynamically changes the object's Class.
 */
ID.prototype.setClass = function (newClass) {
  return core.wrapValue(core.object_setClass(this.pointer, newClass.pointer), '#');
};

/**
 * Walks up the inheritance chain and returns an Array of Strings of
 * superclasses.
 */
ID.prototype.ancestors = function () {
  return this.getClass().ancestors();
};

/*!
 * Struct used by msgSend().
 */
var objc_super = Struct({
  'receiver': 'pointer',
  'class': 'pointer'
});

/*!
 * The parseArgs() function is used by 'id()' and 'id.super()'.
 * You pass in an Array as the second parameter as a sort of "output variable"
 * It returns the selector that was requested.
 */
function parseArgs (argv, args) {
  var argc = argv.length;
  var sel;
  if (argc === 1) {
    var arg = argv[0];
    if (typeof arg === 'string') {
      // selector with no arguments
      sel = arg;
    } else {
      // legacy API: an Object was passed in
      sel = [];
      Object.keys(arg).forEach(function (s) {
        sel.push(s);
        args.push(arg[s]);
      });
      sel.push('');
      sel = sel.join(':');
    }
  } else {
    // varargs API
    sel = [];
    for (var i=0; i<argc; i+=2) {
      sel.push(argv[i]);
      args.push(argv[i+1]);
    }
    sel.push('');
    sel = sel.join(':');
  }
  return sel;
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
ID.prototype.msgSend = function(args, supre, _parentFn) {
  var struct = [];
  var args = [this, parseArgs(args, struct)].concat(struct);
  var sel = args[1];
  var types = this.getTypes(args[1], args.slice(2));
  var funcptr = core.objc_msgSend;
  var parentFn = arguments.length >= 3 ? _parentFn : this.msgSend;

  console.assert(sel, 'Selector passed in was empty.');

  if (supre) {
    args[0] = new objc_super({
      receiver: this.pointer,
      class: core.class_getSuperclass(core.object_getClass(this.pointer))
    }).ref();
    types[1][0] = '?';
    funcptr = core.objc_msgSendSuper;
  }

  if ((struct = core.Types.getStruct(types[0])) && struct.size > 16) {
    struct = new struct();
    types[0] = 'v';
    types[1].unshift('?');
    args.unshift(struct.ref());
    funcptr = supre ? core.objc_msgSendSuper_stret : core.objc_msgSend_stret;
  } else {
    struct = null;
  }

  sel += funcptr.address();
  this.msgCache[sel] = this.msgCache[sel] || core.createUnwrapperFunction(funcptr,types);

  try {
    sel = this.msgCache[sel].apply(null, args);
    return struct || sel;
  } catch (e) {
    if (Buffer.isBuffer(e)) {
      e = Exception(e, parentFn);
    }
    throw e;
  }
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
  return this.msgSend(arguments, true, this.super);
};

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
  var types, method;

  method = this.getMethod(sel);

  if (method) {
    types = method.getTypes();
  }

  if (!types) {
    // Unknown selector being send to object. This *may* still be valid, we
    // assume all args are type 'id' and return is 'id'.
    types = [ '@', [ '@', ':', ].concat(args.map(function () { return '@' })) ];
  }

  return types;
};

/**
 *
 */

ID.prototype.getMethod = function (sel) {
  var c = this.getClass();
  if (!c) return null;
  return c.getInstanceMethod(sel);
};

ID.prototype.getVariable = function (sel) {
  var c = this.getClass();
  if (!c) return null;
  return c.getInstanceVariable(sel);
};

/**
 * Retrieves the wrapped Class instance for an ID (instance or object).
 * If getClass is ran on a Class object it returns the meta-class for the
 * class. (Equivelant to [$.MyClass class]). The meta-class is necessary when
 * implementing an abstract class or using $.NSObject class methods.
 * @api public
 */
ID.prototype.getClass = function() {
  var rtn = core.object_getClass(this.pointer);
  if (ref.isNull(rtn)) return null;
  return core.wrapValue(rtn, '#');
};


/**
 * Getter/setter function for instance variables (ivars) of the object,
 * If just a name is passed in, then this function gets the ivar current value.
 * If a name and a new value are passed in, then this function sets the ivar.
 */
ID.prototype.ivar = function (name, value) {
  // TODO: Add support for passing in a wrapped Ivar instance as the `name`
  if (arguments.length > 1) {
    // setter
    var ivar = this.getVariable(name);
    var unwrapped = core.unwrapValue(value, ivar.getTypeEncoding());
    return core.object_setIvar(this.pointer, ivar.pointer, unwrapped);
  } else {
    var ptr = new Buffer(ref.sizeof.pointer);
    var ivar = core.object_getInstanceVariable(this.pointer, name, ptr);
    return core.wrapValue(ptr.readPointer(0), core.ivar_getTypeEncoding(ivar));
  }
};

/**
 * Returns an Array of Strings of the names of the ivars that the current object
 * contains. This function can iterate through the object's superclasses
 * recursively, if you specify a `maxDepth` argument.
 */
ID.prototype.ivars = function(maxDepth, sort) {
  var rtn = [];
  var c = this.getClass();
  var md = maxDepth || 1;
  var depth = 0;
  while (c && depth++ < md) {
    var is = c.getInstanceVariables();
    var i = is.length;
    while (i--)
      if (!~rtn.indexOf(is[i]))
        rtn.push(is[i]);
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
  var rtn = [];
  var c = this.getClass();
  var md = maxDepth || 1;
  var depth = 0;
  while (c && depth++ < md) {
    var ms = c.getInstanceMethods();
    var i = ms.length;
    while (i--) if (!~rtn.indexOf(ms[i])) rtn.push(ms[i]);
    c = c.getSuperclass();
  }
  return sort === false ? rtn : rtn.sort();
};

/**
 * Returns a **node-ffi** pointer pointing to this object. This is a convenience
 * function for methods that take pointers to objects (i.e. `NSError**`).
 *
 * @return {Pointer} A pointer to this object.
 */
ID.prototype.ref = function () {
  return this.pointer.ref();
};

/**
 * The overidden `toString()` function proxies up to the real Objective-C object's
 * `description` method. In Objective-C, this is equivalent to:
 *
 * ``` objectivec
 * [[id description] UTF8String]
 * ```
 */
ID.prototype.toString = function () {
  return this('description')('UTF8String');
};

/*!
 * Custom inspect() function for `util.inspect()`.
 */
ID.prototype.inspect = function () {
  return this.toString();
};
