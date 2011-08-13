/**
 * The 'id' function is essentially the "base class" for all Objective-C
 * objects that get passed around JS-land.
 */

var proto = exports.proto = Object.create(Function.prototype)
  , core  = require('./core')
  , types = require('./types')
  , SEL   = require('./sel')

/**
 * Wraps up an ffi pointer that is expected to be a compatible Objective-C
 * object that can recieve messages.
 */
exports.wrap = function wrap (pointer) {

  // This 'id' function is syntax sugar around the msgSend function attached to
  // it. 'msgSend' is expecting the selector first, an Array of args second, so
  // this function just massages it into place and returns the result.
  function id (arg) {
    var args = []
      , sel
    if (arg.constructor.name == 'String') {
      sel = arg
    } else {
      sel = []
      Object.keys(arg).forEach(function (s) {
        sel.push(s)
        args.push(arg[s])
      });
      sel.push('')
      sel = sel.join(':')
    }
    return id.msgSend(sel, args)
  }

  // Save a reference to the pointer for msgSend
  id.pointer = pointer;
  // The 'types' object contains the cached references to the computed return
  // type and argument types for given selectors. We use prototype inheritance
  // on it to set up inheritance via superclasses (this way, 'init' on
  // NSObjects get cached for *all* NSObject instances, not just one.
  id.types = {};
  // Morph into a MUTANT FUNCTION FREAK!!1!
  id.__proto__ = proto;
  return id;
}


proto.msgSend = function msgSend (sel, args) {
  var types = this._getTypes(sel)
    , rtnType = types[0]
    , msgSendFunc = core.get_objc_msgSend(types)
    , selRef = SEL.toSEL(sel)
    , rtn = msgSendFunc.apply(null, [ this.pointer, selRef ].concat(args))
  //console.error(types);
  //console.error(rtn);
  // Process the return value into an wrapped value if needed
  if (rtnType == '@') {
    rtn = exports.wrap(rtn)
  } else if (rtnType == '#') {
    rtn = exports._getClass(core.class_getName(rtn));
  }
  return rtn;
}

proto.toString = function toString () {
  return this('description')('UTF8String');
}

/**
 * Accepts a SEL and queries the current object for the return type and
 * argument types for the given selector. If current object does not implment
 * that selector, then check the superclass, and repeat recursively until
 * a subclass that responds to the selector is found, or until the base class
 * is found (in which case the current obj does not respond to 'sel' and we
 * should throw an Error).
 */
proto._getTypes = function getTypes (sel) {
  var c = this.getClass()
    , t = c._getTypesClass(sel, this.isClass)
  if (!t) throw new Error('Object does not respond to selector: '+sel);
  return t;
}

/**
 * Retrieves the Class instance for a given object. If this object is already
 * a Class instance, then this function return's the Class' "metaclass".
 * TODO: Caching
 */
proto.getClass = function getClass () {
  var className = core.object_getClassName(this.pointer);
  return exports._getClass(className);
}
