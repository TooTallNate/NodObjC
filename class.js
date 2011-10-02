exports.getClass = getClass
exports.wrap = wrap

var id = require('./id')
  , proto = exports.proto = Object.create(id.proto)
  , core = require('./core')
  , types = require('./types')
  , method = require('./method')
  , _global = require('./index')
  , ivar = require('./ivar')
  , IMP = require('./imp')
  , SEL = require('./sel')
  , classCache = {}


/**
 * Gets a wrapped Class instance based off the given name.
 * Also takes care of returning a cached version when available.
 */
function getClass (c) {
  var rtn = classCache[c];
  if (!rtn) {
    var pointer = core.objc_getClass(c);
    rtn = exports.wrap(pointer, c);
  }
  return rtn;
}


/**
 * Wraps a Class pointer.
 */
function wrap (pointer, className) {
  var w = id.wrap(pointer);
  w.__proto__ = proto;
  pointer._type = '#'
  // optionally cache when a class name is given
  if (className) {
    classCache[className] = w;
  }
  return w;
}

// Flag used by id#msgSend()
proto.isClass = true

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
  _global[this.getName()] = this
  return this
}

proto.addMethod = function addMethod (selector, type, func) {
  var parsed = types.parse(type)
    , selRef = SEL.toSEL(selector)
    , funcPtr = IMP.createWrapperPointer(func, parsed)
  var good = core.class_addMethod(this.pointer, selRef, funcPtr, type)
  if (!good) throw new Error('method "' + selector + '" was NOT sucessfully added to Class: ' + this.getName())
  return this
}

/**
 * Adds an Ivar to the Class. Instances of the class will contain the specified
 * instance variable. This MUST be called after .extend() but BEFORE .register()
 */
proto.addIvar = function addIvar (name, type, size, alignment) {
  if (!size) {
    // Lookup the size of the type when needed
    var ffiType = types.map(type)
    size = core.TYPE_SIZE_MAP[ffiType]
  }
  if (!alignment) {
    // Also set the alignment when needed. This formula is from Apple's docs:
    //   For variables of any pointer type, pass log2(sizeof(pointer_type)).
    alignment = Math.log(size) / Math.log(2)
  }
  var good = core.class_addIvar(this.pointer, name, size, alignment, type)
  if (!good) throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName())
  return this
}

proto.addProtocol = function addProtocol (protocol) {
  throw new Error('TODO')
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

proto.getIvarLayout = function getIvarLayout () {
  return core.class_getIvarLayout(this.pointer)
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

proto.getInstanceVariable = function getInstanceVariable (name) {
  return ivar.wrap(this._getInstanceVariable(name))
}

proto._getInstanceVariable = function _getInstanceVariable (name) {
  return core.class_getInstanceVariable(this.pointer, name)
}

proto.getClassVariable = function getClassVariable (name) {
  return ivar.wrap(this._getClassVariable(name))
}

proto._getClassVariable = function _getClassVariable (name) {
  return core.class_getClassVariable(this.pointer, name)
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
 * Returns an Array of the class variables this Class has. Superclass variables
 * are not included.
 */
proto.getClassVariables = function getClassVariables () {
  return core.copyIvarList(this._getClassPointer())
}

/**
 * Returns an Array of the instance variables this Class has. Superclass
 * variables are not included.
 */
proto.getInstanceVariables = function getInstanceVariables () {
  return core.copyIvarList(this.pointer)
}

/**
 * Returns an Array of all the class methods this Class responds to.
 * This function returns the raw, unsorted result of copyMethodList().
 */
proto.getClassMethods = function getClassMethods () {
  // getClassPointer() on a Class actually gets a pointer to the metaclass
  return core.copyMethodList(this._getClassPointer())
}

/**
 * Returns an Array of all the instance methods an instance of this Class will
 * respond to.
 * This function returns the raw, unsorted result of copyMethodList().
 */
proto.getInstanceMethods = function getInstanceMethods () {
  return core.copyMethodList(this.pointer)
}

/**
 * Allocates a new pointer to this type. The pointer points to `nil` initially.
 * This is meant for creating a pointer to hold an NSError*, and pass a ref()
 * to it into a method that accepts an 'error' double pointer.
 */
proto.createPointer = function createPointer () {
  var ptr = new core.Pointer(core.TYPE_SIZE_MAP.pointer)
  ptr.putPointer(core.Pointer.NULL)
  ptr._type = '@'
  return ptr
}

proto.toString = function toString () {
  return '[Class: ' + this.getName() + ']'
}

proto.inspect = function inspect () {
  // yellow
  return '\033[33m' + this.toString() + '\033[39m'
}
