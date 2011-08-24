var core = require('./core')
  , types = require('./types')
  , method = require('./method')
  , IMP = require('./imp')
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
id._wrapClass = core._wrapClass = exports.wrap;

/**
 * Creates a subclass of the current class with the given name and optionally
 * a number of extra bytes that need to be allocated with each instance.
 * The returned Class instance should have 'addMethod()' and 'addIvar()' called
 * on it as needed, and then 'register()' when you're ready to use it.
 */
proto.extend = function extend (className, extraBytes) {
  var c = core.objc_allocateClassPair(this.pointer, className, extraBytes || 0);
  if (c.isNull()) throw new Error('New Class could not be allocated: ' + className);
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
  return this
}

proto.addMethod = function addMethod (selector, type, func) {
  var parsed = types.parse(type)
    , selRef = SEL.toSEL(selector)
    , funcPtr = IMP.createWrapperPointer(func, parsed)
  core.class_addMethod(this.pointer, selRef, funcPtr, type)
  return this
}

proto.addIvar = function addIvar () {
  throw new Error("TODO")
  return this
}

proto._getSuperclassPointer = function getSuperclassPointer () {
  return core.class_getSuperclass(this.pointer);
}

proto.getName = function getName () {
  return core.class_getName(this.pointer);
}

proto.isMetaClass = function isMetaClass () {
  return !!core.class_isMetaClass(this.pointer);
}

proto.getInstanceSize = function getInstanceSize () {
  return core.class_getInstanceSize(this.pointer);
}

/**
 * Get's a Class instance's superclass. If the current class is a base class,
 * then this will return null.
 */
proto.getSuperclass = function getSuperclass () {
  var superclassPointer = this._getSuperclassPointer()
  if (superclassPointer.isNull()) return null;
  return exports.wrap(superclassPointer);
}

proto.setSuperclass = function setSuperclass (superclass) {
  return exports.wrap(this._setSuperclassPointer(superclass.pointer));
}

proto._setSuperclassPointer = function setSuperclassPointer (superclassPointer) {
  return core.class_setSuperclass(this.pointer, superclassPointer);
}

proto.getInstanceMethod = function getInstanceMethod (sel) {
  return method.wrap(this._getInstanceMethod(SEL.toSEL(sel)))
}

proto._getInstanceMethod = function _getInstanceMethod (selPtr) {
  return core.class_getInstanceMethod(this.pointer, selPtr)
}

proto.getClassMethod = function getClassMethod (sel) {
  return method.wrap(this._getClassMethod(SEL.toSEL(sel)))
}

proto._getClassMethod = function _getClassMethod (selPtr) {
  return core.class_getClassMethod(this.pointer, selPtr)
}

proto._getTypesClass = function getTypesClass (sel, isClass) {
  //console.error('_getTypesClass: %s, isClass: %d', sel, isClass);
  var method = this['get'+(isClass ? 'Class' : 'Instance')+'Method'](sel)
  if (!method) return null;
  return method.getTypes();
}

proto.getVersion = function getVersion () {
  return core.class_getVersion(this.pointer);
}

proto.setVersion = function setVersion (v) {
  return core.class_setVersion(this.pointer, v);
}

/**
 * Returns an Array of all the class methods this Class responds to.
 */
proto.getClassMethods = function getClassMethods () {
  // getClassPointer() on a Class actually gets a pointer to the metaclass
  return core.copyMethodList(this._getClassPointer())
}

/**
 * Returns an Array of all the instance methods an instance of this Class will
 * respond to.
 */
proto.getInstanceMethods = function getInstanceMethods () {
  return core.copyMethodList(this.pointer)
}

proto.toString = function toString () {
  return '[Class: ' + this.getName() + ']'
}

proto.inspect = function inspect () {
  // yellow
  return '\033[33m' + this.toString() + '\033[39m'
}
