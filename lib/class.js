module.exports = (function() { 
  /**
   * The `Class` class is a subclass of `id`. Instances of `Class` wrap an
   * Objective C *"Class"* instance.
   *
   * You can retrieve `Class` instances by getting a reference to a global class
   * (i.e. `$.NSObject`), or by other methods/functions that return `Class`
   * instances normally (i.e. `$.NSClassFromString($('NSObject'))`).
   */

  /*!
   * Module dependencies.
   */
  var core = require('./core')
    , method = require('./method')
    , ivar = require('./ivar')
    , classCache = {}
    , garbagePreventionCache = {sel:[],func:[]};

  function Class() {
    throw new Error('This is a dummy constructor and shouldnt be used.');
  }

  // Flag used by ID#msgSend()
  Class.prototype.isClass = true;

  /**
   * Wraps the given *pointer*, which should be an Objective-C Class, and returns
   * a `Class` instance.
   *
   * @param {Pointer} pointer The Class pointer to wrap.
   * @param {String} className An optional class name to cache the Class wrapper with.
   * @return {Class} A `Class` instance wrapping the given *pointer*.
   * @api private
   */
  Class.wrap = function(pointer, className) {
    console.assert(pointer !== 0 && pointer.address() !== 0, 'Class constructor is null. ',pointer,' class: ',className);
    //TODO: Decouple this...
    var ID = require('./id');
    var w = ID.wrap(pointer);
    w.__proto__ = Class.prototype;
    w.pointer = pointer;
    pointer._type = '#';

    // optionally cache when a class name is given
    if (className) classCache[className] = w;
    return w;
  }

  /**
   * Gets a wrapped Class instance based off the given name.
   * Also takes care of returning a cached version when available.
   *
   * @param {String} className The class name to load.
   * @return {Class} A `Class` instance wrapping the desired Objective C *"Class"*.
   * @api private
   */
  Class.getClassByName = function(className, onto) {
    var rtn = classCache[className];
    var ptrFromClassName = core.objc_getClass(className);
    console.assert(ptrFromClassName !== null && ptrFromClassName.address() !== 0,
      'Class.getClass cannot identify the unidentified class: ',ptrFromClassName, ' pointer:',ptrFromClassName.address());
    if (!rtn) rtn = Class.wrap(ptrFromClassName, className);
    if (onto) rtn.onto = onto;
    return rtn;
  }

  /**
   * Creates a subclass of this class with the given name and optionally a
   * number of extra bytes that will be allocated with each instance. The
   * returned `Class` instance should have `addMethod()` and `addIvar()` called on
   * it as needed before use, and then `register()` when you're ready to use it.
   */
  Class.prototype.extend = function(className, extraBytes) {
    var c = core.objc_allocateClassPair(this.pointer, className, extraBytes || 0);
    if (c.isNull()) throw new Error('New Class could not be allocated: ' + className);
    var rtn = Class.wrap(c, className);
    rtn.onto = this.onto;
    return rtn;
  }

  /**
   * Calls objc_registerClassPair() on the class pointer.
   * This must be called on the class *after* all 'addMethod()' and 'addIvar()'
   * calls are made, and *before* the newly created class is used for real.
   */
  Class.prototype.register = function() {
    core.objc_registerClassPair(this.pointer);
    this.onto[this.getName()] = this;
    return this;
  }

  /**
   * Adds a new Method to the Class. Instances of the class (even already existing
   * ones) will have the ability to invoke the method. This may be called at any
   * time on any class.
   */
  Class.prototype.addMethod = function(selector, type, func) {
    var parsed = core.Types.parse(type);
    var selRef = core.toSEL(selector);
    var funcPtr = core.createWrapperPointer(func, parsed);
    // flatten the type
    var typeStr = parsed[0] + parsed[1].join('');
    if (!core.class_addMethod(this.pointer, selRef, funcPtr, typeStr))
      throw new Error('method "' + selector + '" was NOT sucessfully added to Class: ' + this.getName());
    // Added to prevent garbage collection, the class is discarded the added methods will be.
    // if these do not exist the the new method will error on execution due to lost callbacks.
    garbagePreventionCache.func.push(funcPtr);
    garbagePreventionCache.sel.push(selRef);
    return this;
  }

  /**
   * Adds an Ivar to the Class. Instances of the class will contain the specified
   * instance variable. This MUST be called after .extend() but BEFORE .register()
   */
  Class.prototype.addIvar = function(name, type, size, alignment) {
    if (!size) {
      // Lookup the size of the type when needed
      var ffiType = core.Types.map(type);
      size = core.REF.sizeof[ffiType]; 
    }
    // Also set the alignment when needed. This formula is from Apple's docs:
    //   For variables of any pointer type, pass log2(sizeof(pointer_type)).
    if (!alignment) alignment = Math.log(size) / Math.log(2);
    if (!core.class_addIvar(this.pointer, name, size, alignment, type))
      throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName());
    return this;
  }

  /* Proxy methods */
  Class.prototype.getName = function() { return core.class_getName(this.pointer); }
  Class.prototype.isMetaClass = function() { return !!core.class_isMetaClass(this.pointer); }
  Class.prototype.getInstanceSize = function() { return core.class_getInstanceSize(this.pointer); }
  Class.prototype.getIvarLayout = function() { return core.class_getIvarLayout(this.pointer); }
  Class.prototype.getVersion = function() { return core.class_getVersion(this.pointer); }
  Class.prototype.setVersion = function(v) { return core.class_setVersion(this.pointer, v); }
  Class.prototype.setSuperclass = function(superclass) { return Class.wrap(core.class_setSuperclass(this.pointer, superclass.pointer)); }
  Class.prototype.getInstanceVariable = function(name) { return Class.wrap(core.class_getInstanceVariable(this.pointer, name)); }
  Class.prototype.getClassVariable = function(name) { return ivar.wrap(core.class_getClassVariable(this.pointer, name)); }
  Class.prototype.getInstanceMethod = function(sel) { return method.wrap(core.class_getInstanceMethod(this.pointer, core.toSEL(sel))); }
  Class.prototype.getClassMethod = function(sel) { return method.wrap(core.class_getClassMethod(this.pointer, core.toSEL(sel))); }
  Class.prototype.getInstanceVariables = function() { return core.copyIvarList(this.pointer); }
  Class.prototype.getInstanceMethods = function() { return core.copyMethodList(this.pointer);  }
  
  /**
   * Get's a Class instance's superclass. If the current class is a base class,
   * then this will return null.
   */
  Class.prototype.getSuperclass = function() {
    var superclassPointer = core.class_getSuperclass(this.pointer);
    if (superclassPointer.isNull()) return null;
    return Class.wrap(superclassPointer);
  }

  Class.prototype.getTypesClass = function(sel, isClass) {
    var method = this['get'+(isClass ? 'Class' : 'Instance')+'Method'](sel);
    return method ? method.getTypes() : null;
  }

 /**
   * Returns an Array of Strings of the names of methods that the current object
   * will respond to. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` number argument.
   */
  Class.prototype.methods = function(maxDepth, sort) {
    var rtn=[], c=this, md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      var ms=core.copyMethodList(c.pointer); i=ms.length;
      while (i--) if (!~rtn.indexOf(ms[i])) rtn.push(ms[i]);
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  }

  /**
   * Allocates a new pointer to this type. The pointer points to `nil` initially.
   * This is meant for creating a pointer to hold an NSError*, and pass a ref()
   * to it into a method that accepts an 'error' double pointer.
   * XXX: Tentative API - name will probably change
   */
  Class.prototype.createPointer = function() {
    // We do some "magic" here to support the dereferenced
    // pointer to become an obj-c type.
    var ptr = core.REF.alloc('pointer', null);
    ptr._type = '@';
    var _ref = ptr.ref;
    ptr.ref = function() {
      var v = _ref.call(ptr,arguments);
      var _deref = v.deref;
      v.deref = function() {
        return Class.wrap(_deref.call(v,arguments));
      };
      return v;
    }
    //ptr.deref = function() {
    //  return Class.wrap(_deref.call(ptr,arguments));
    //}
    return ptr;
  }

  /*!
   * toString() override.
   */
  Class.prototype.toString = function() { return '[Class' + (this.isMetaClass() ? ' ◆' : '') +  ': ' + this.getName() + ']'; }

  // yellow
  Class.prototype.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }

  return Class;
})();

//DEAD CODE FROM class.js
/**
 * Returns an Array of the class variables this Class has. Superclass variables
 * are not included.
 */
//Class.prototype.getClassVariables = function() {
//  return core.copyIvarList(this._getClassPointer());
//}
/**
 * Returns an Array of all the class methods this Class responds to.
 * This function returns the raw, unsorted result of copyMethodList().
 */
//Class.prototype.getClassMethods = function() {
//  return core.copyMethodList(this._getClassPointer());
//}
/**
 * Adds a `Protocol` to the list of protocols that this class "conforms to"
 * (a.k.a "implements"). Usually, an implementation object is passed in that
 * defines the Protocol's defined methods onto the class.
 */
//Class.prototype.addProtocol = function(protocolName, impl) {
//  var formal = core.objc_getProtocol(protocolName);
//  console.error(core.copyMethodDescriptionList(formal, 1, 1));
//  console.error(core.copyMethodDescriptionList(formal, 0, 0));
//  console.error(core.copyMethodDescriptionList(formal, 1, 0));
//  console.error(core.copyMethodDescriptionList(formal, 0, 1));
//}