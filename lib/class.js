
/**
 * The `Class` Object is a subclass of `id`. Instances of `Class` wrap an
 * Objective C "Class" instance.
 */

/*!
 * Module exports.
 */

exports.getClass = getClass
exports.wrap = wrap

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC')
  , id = require('./id')
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
 *
 * @param {String} className The class name to load.
 * @return {Class} A `Class` instance wrapping the desired Objective C *"Class"*.
 */

function getClass (className) {
  debug('getClass:', className)
  var rtn = classCache[className]
  if (rtn) {
    debug('the classCache actually worked!!!!', className)
  } else {
    var pointer = core.objc_getClass(className)
    rtn = exports.wrap(pointer, className)
  }
  return rtn
}

/**
 * Wraps a Class pointer.
 */

function wrap (pointer, className) {
  debug('Class#wrap(%d, %s)', pointer.address, className)
  var w = id.wrap(pointer)
  w.__proto__ = proto
  pointer._type = '#'
  // optionally cache when a class name is given
  if (className) {
    classCache[className] = w
  }
  return w
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
  var c = core.objc_allocateClassPair(this.pointer, className, extraBytes || 0)
  if (c.isNull()) {
    throw new Error('New Class could not be allocated: ' + className)
  }
  return exports.wrap(c, className)
}

/**
 * Calls objc_registerClassPair() on the class pointer.
 * This must be called on the class *after* all 'addMethod()' and 'addIvar()'
 * calls are made, and *before* the newly created class is used for real.
 */

proto.register = function register () {
  core.objc_registerClassPair(this.pointer)
  _global[this.getName()] = this
  return this
}

/**
 * Adds a new Method to the Class. Instances of the class (even already existing
 * ones) will have the ability to invoke the method. This may be called at any
 * time on any class.
 */

proto.addMethod = function addMethod (selector, type, func) {
  var parsed = types.parse(type)
    , selRef = SEL.toSEL(selector)
    , funcPtr = IMP.createWrapperPointer(func, parsed)
  if (!core.class_addMethod(this.pointer, selRef, funcPtr, type)) {
    throw new Error('method "' + selector + '" was NOT sucessfully added to Class: ' + this.getName())
  }
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
  if (!core.class_addIvar(this.pointer, name, size, alignment, type)) {
    throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName())
  }
  return this
}

/**
 * Adds a Protocol to the list of protocols that this class "conforms to", or
 * "implements". Usually, an implementation object is passed in that defined the
 * Protocol's defined methods onto the class conveniently.
 */

proto.addProtocol = function addProtocol (protocolName, impl) {
  var informal = require('./bridgesupport').informal_protocols[protocolName]
    , formal = core.objc_getProtocol(protocolName)

  console.error(core.copyMethodDescriptionList(formal, 1, 1))
  console.error(core.copyMethodDescriptionList(formal, 0, 0))
  console.error(core.copyMethodDescriptionList(formal, 1, 0))
  console.error(core.copyMethodDescriptionList(formal, 0, 1))
}

proto._getSuperclassPointer = function getSuperclassPointer () {
  return core.class_getSuperclass(this.pointer)
}

proto.getName = function getName () {
  return core.class_getName(this.pointer)
}

proto.isMetaClass = function isMetaClass () {
  return !!core.class_isMetaClass(this.pointer)
}

proto.getInstanceSize = function getInstanceSize () {
  return core.class_getInstanceSize(this.pointer)
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
  if (superclassPointer.isNull()) return null
  return exports.wrap(superclassPointer)
}

proto.setSuperclass = function setSuperclass (superclass) {
  return exports.wrap(this._setSuperclassPointer(superclass.pointer))
}

proto._setSuperclassPointer = function setSuperclassPointer (superclassPointer) {
  return core.class_setSuperclass(this.pointer, superclassPointer)
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
  //console.error('_getTypesClass: %s, isClass: %d', sel, isClass)
  var method = this['get'+(isClass ? 'Class' : 'Instance')+'Method'](sel)
  return method ? method.getTypes() : null
}

proto.getVersion = function getVersion () {
  return core.class_getVersion(this.pointer)
}

proto.setVersion = function setVersion (v) {
  return core.class_setVersion(this.pointer, v)
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
 * XXX: Tentative API - name will probably change
 */

proto.createPointer = function createPointer () {
  var ptr = new core.Pointer(core.TYPE_SIZE_MAP.pointer)
  ptr.putPointer(core.Pointer.NULL)
  ptr._type = '@'
  return ptr
}

/*!
 * toString() override.
 */

proto.toString = function toString () {
  return '[Class: ' + this.getName() + ']'
}

proto.inspect = function inspect () {
  // yellow
  return '\033[33m' + this.toString() + '\033[39m'
}
