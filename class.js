var core = require('./core')
  , SEL = require('./sel')
  , id = require('./id')
  , classCache = {}

var proto = exports.proto = Object.create(id.proto);

/**
 * Gets a wrapped Class instance based off the given name.
 * Also takes care of returning a cached version when available.
 */
exports.getClass = function (c) {
  var rtn = classCache[c];
  if (!rtn) {
    var pointer = core.objc_getClass(c);
    rtn = exports.wrap(pointer, c);
  }
  return rtn;
}
// Making the getClass function available to the id module, to avoid circular deps
id._getClass = core._getClass = exports.getClass;


/**
 * Wraps a Class pointer.
 */
exports.wrap = function wrap (pointer, className) {
  var w = id.wrap(pointer);
  w.isClass = true;
  w.__proto__ = proto;
  // optionally cache when a class name is given
  if (className) {
    w.className = className;
    classCache[className] = w;
  }
  return w;
}

/**
 * Creates a subclass of the current class with the given name and optionally
 * a number of extra bytes that need to be allocated with each instance.
 * The returned Class instance should have 'addMethod()' and 'addIvar()' called
 * on it as needed, and then 'register()' when you're ready to use it.
 */
proto.extend = function extend (className, extraBytes) {
  var c = core.objc_allocateClassPair(this.pointer, className, extraBytes || 0);
  if (c.isNull()) throw new Error('New class could not be allocated!');
  return exports.wrap(c, className);
}

/**
 * Calls objc_registerClassPair() on the class pointer.
 * This must be called on the class *after* all 'addMethod()' and 'addIvar()'
 * calls are made, and *before* the newly created class is used for real.
 */
proto.register = function register () {
  core.objc_registerClassPair(this.pointer);
  // TODO: Attach 'this' to the global exports, for access from there
}

/**
 * Get's a Class instance's superclass. If the current class is a base class,
 * then this will return null.
 */
proto.getSuperclass = function getSuperclass () {
  var superclassPointer = core.class_getSuperclass(this.pointer)
  if (superclassPointer.isNull()) return null;
  var name = core.class_getName(superclassPointer)
    , superclass = exports.getClass(name)
  return superclass;
}

proto.getInstanceMethod = function getInstanceMethod (sel) {
  return core.class_getInstanceMethod(this.pointer, SEL.toSEL(sel));
}

proto.getClassMethod = function getClassMethod (sel) {
  return core.class_getClassMethod(this.pointer, SEL.toSEL(sel));
}

proto._getTypesClass = function getTypesClass (sel, isClass) {
  //console.error('_getTypesClass: %s, isClass: %d', sel, isClass);
  var method = this['get'+(isClass ? 'Class' : 'Instance')+'Method'](sel);
  if (method.isNull()) return null;
  return [ core.getMethodReturnType(method), core.getMethodArgTypes(method) ];
}
