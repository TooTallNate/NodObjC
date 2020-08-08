module.exports = Class;

/*!
 * Module dependencies.
 */
var ref = require('ref-napi');
var createFunction = require('function-class');

var core = require('./core');
var ID = require('./id');
var ivar = require('./ivar');
var method = require('./method');
var inherits = require('./inherits');
var _global = require('./index');

var classCache = {};
var garbagePreventionCache = {
  sel: [],
  func: []
};

/**
 * The `Class` class is a subclass of `id`. Instances of `Class` wrap an
 * Objective C *"Class"* instance.
 *
 * You can retrieve `Class` instances by getting a reference to a global class
 * (i.e. `$.NSObject`), or by other methods/functions that return `Class`
 * instances normally (i.e. `$.NSClassFromString($('NSObject'))`).
 */
function Class (pointer) {
  if (typeof this !== 'function')
    return createFunction(null, 0, Class, arguments);

  ID.call(this, pointer);
}
inherits(Class, ID);

Class.prototype.type = '#';

/**
 * Gets a wrapped Class instance based off the given name.
 * Also takes care of returning a cached version when available.
 *
 * @param {String} className The class name to load.
 * @return {Class} A `Class` instance wrapping the desired Objective C *"Class"*.
 * @api private
 */
Class.getClassByName = function (className) {
  var rtn = classCache[className];
  var ptrFromClassName = core.objc_getClass(className);
  console.assert(ptrFromClassName !== null && ptrFromClassName.address() !== 0,
    'Class.getClass cannot identify the unidentified class: ',ptrFromClassName, ' pointer:',ptrFromClassName.address());
  if (!rtn) rtn = core.wrapValue(ptrFromClassName, '#');
  return rtn;
};

/**
 *
 */

Class.prototype.getMethod = function (sel) {
  return this.getClassMethod(sel);
};

Class.prototype.getVariable = function (name) {
  return this.getClassVariable(name);
};

/**
 * Walks up the inheritance chain and returns an Array of Strings of
 * superclasses.
 */
Class.prototype.ancestors = function () {
  var rtn = [];
  var c = this;
  do {
    rtn.push(c.getName());
    c = c.getSuperclass();
  } while (c);
  return rtn;
};

/**
 * Creates a subclass of this class with the given name and optionally a
 * number of extra bytes that will be allocated with each instance. The
 * returned `Class` instance should have `addMethod()` and `addIvar()` called on
 * it as needed before use, and then `register()` when you're ready to use it.
 */
Class.prototype.extend = function(className, _extraBytes) {
  var extraBytes = arguments.length >= 2 ? extraBytes : 0;
  var c = core.objc_allocateClassPair(this.pointer, className, extraBytes);
  if (ref.isNull(c)) {
    throw new Error('New Class could not be allocated: ' + className);
  }
  var rtn = core.wrapValue(c, '#');
  return rtn;
}

/**
 * Calls objc_registerClassPair() on the class pointer.
 * This must be called on the class *after* all 'addMethod()' and 'addIvar()'
 * calls are made, and *before* the newly created class is used for real.
 */
Class.prototype.register = function() {
  core.objc_registerClassPair(this.pointer);
  _global[this.getName()] = this;
  return this;
}

/**
 * Adds a new Method to the Class as a class method.  This method
 * is only usable on the class, not on its instance (e.g, type +).
 */
Class.prototype.addClassMethod = function(sel, type, func) {
  return this.addMethod(sel, type, func, core.object_getClass(this.pointer));
}

/**
 * Adds a new Method to the Class. Instances of the class (even already existing
 * ones) will have the ability to invoke the method. This may be called at any
 * time on any class.
 */
Class.prototype.addMethod = function(sel, type, func, pointerOverride) {
  var ptr = pointerOverride || this.pointer;
  var parsed = core.Types.parse(type);
  var selRef = core.unwrapValue(sel,':');
  var funcPtr = core.createWrapperPointer(func, parsed);

  // flatten the type
  var typeStr = parsed[0] + parsed[1].join('');
  if (!core.class_addMethod(ptr, selRef, funcPtr, typeStr))
    throw new Error('method "' + sel + '" was NOT sucessfully added to Class: ' + this.getName());

  // Added to prevent garbage collection, the class is discarded the added methods will be.
  // if these do not exist the the new method will error on execution due to lost callbacks.
  garbagePreventionCache.func.push(funcPtr);
  garbagePreventionCache.sel.push(selRef);
  return this;
};

/**
 * Adds an Ivar to the Class. Instances of the class will contain the specified
 * instance variable. This MUST be called AFTER `.extend()`, and
 * BEFORE `.register()`
 */
Class.prototype.addIvar = function(name, type, size, alignment) {
  if (!size) {
    // Lookup the size of the type when needed
    var ffiType = core.Types.map(type);
    size = ref.sizeof[ffiType];
  }
  // Also set the alignment when needed. This formula is from Apple's docs:
  //   For variables of any pointer type, pass log2(sizeof(pointer_type)).
  if (!alignment) alignment = Math.log(size) / Math.log(2);
  if (!core.class_addIvar(this.pointer, name, size, alignment, type))
    throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName());
  return this;
};

/* Proxy methods */
Class.prototype.getName = function() {
  return core.class_getName(this.pointer);
};

Class.prototype.isMetaClass = function() {
  return core.class_isMetaClass(this.pointer);
};

Class.prototype.getInstanceSize = function() {
  return core.class_getInstanceSize(this.pointer);
};

Class.prototype.getIvarLayout = function() {
  return core.class_getIvarLayout(this.pointer);
};

Class.prototype.getVersion = function() {
  return core.class_getVersion(this.pointer);
};

Class.prototype.setVersion = function(v) {
  return core.class_setVersion(this.pointer, v);
};

Class.prototype.setSuperclass = function(superclass) {
  return core.wrapValue(core.class_setSuperclass(this.pointer, superclass.pointer), '#');
};

Class.prototype.getInstanceVariable = function(name) {
  return ivar.wrap(core.class_getInstanceVariable(this.pointer, name));
};

Class.prototype.getClassVariable = function(name) {
  return ivar.wrap(core.class_getClassVariable(this.pointer, name));
};

Class.prototype.getInstanceMethod = function(sel) {
  return method.wrap(core.class_getInstanceMethod(this.pointer, core.unwrapValue(sel, ':')));
};

Class.prototype.getClassMethod = function(sel) {
  return method.wrap(core.class_getClassMethod(this.pointer, core.unwrapValue(sel, ':')));
};

Class.prototype.getInstanceVariables = function() {
  return core.copyIvarList(this.pointer);
};

Class.prototype.getInstanceMethods = function() {
  return core.copyMethodList(this.pointer);
};

/**
 * Get's a Class instance's superclass. If the current class is a base class,
 * then this will return null.
 */
Class.prototype.getSuperclass = function() {
  var superclassPointer = core.class_getSuperclass(this.pointer);
  if (ref.isNull(superclassPointer)) return null;
  return core.wrapValue(superclassPointer, '#');
};

/*!
 * toString() override.
 */
Class.prototype.toString = function () {
  return '[Class' + (this.isMetaClass() ? ' ◆' : '') +  ': ' + this.getName() + ']';
};

// yellow
Class.prototype.inspect = function () {
  return '\033[33m' + this.toString() + '\033[39m';
};
