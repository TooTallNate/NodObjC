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
    , garbagePreventionCache = {sel:[],func:[]}
    , exception = require('./exception');

  function Class(pointer) { 
    Function.call(this, pointer);
    this.classPointer = pointer;
    this.pointer = pointer; // TODO: Get rid of this.
    this.isClass = true;
    this.type = '#';
  }
  Class.prototype = Object.create(Function.prototype);
  Class.prototype.constructor = Class;

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
    
    // See if this pointer already has an ID (or even a Class) associated with it.
    var cache = core.objc_getAssociatedObject(pointer, core.objcStorageKey);
    if(!cache.isNull())
      return cache.readObject(0);

    // Create a new class object.
    var newClass = new Class(pointer);
    var rtn = function() {
      var args = [];
      var sel = core.parseArgs(arguments,args);
      return newClass.msgSend(sel,args,false);
    };
    rtn.__proto__ = newClass;

    // Store the object we created as part of the pointer defined.
    var ref = new core.REF.alloc('Object');
    ref.free = false;
    ref.writeObject(rtn, 0);
    core.objc_setAssociatedObject(pointer, core.objcStorageKey, ref, 0);

    return rtn;
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
    var c = core.objc_allocateClassPair(this.classPointer, className, extraBytes || 0);
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
    core.objc_registerClassPair(this.classPointer);
    this.onto[this.getName()] = this;
    return this;
  }

  /**
   * Adds a new Method to the Class. Instances of the class (even already existing
   * ones) will have the ability to invoke the method. This may be called at any
   * time on any class.
   */
  Class.prototype.addMethod = function(sel, type, func) {
    var parsed = core.Types.parse(type);
    var selRef = core.unwrapValue(sel,':');
    var funcPtr = core.createWrapperPointer(func, parsed);
    // flatten the type
    var typeStr = parsed[0] + parsed[1].join('');
    if (!core.class_addMethod(this.classPointer, selRef, funcPtr, typeStr))
      throw new Error('method "' + sel + '" was NOT sucessfully added to Class: ' + this.getName());
    // Added to prevent garbage collection, the class is discarded the added methods will be.
    // if these do not exist the the new method will error on execution due to lost callbacks.
    garbagePreventionCache.func.push(funcPtr);
    garbagePreventionCache.sel.push(selRef);
    return this;
  }

  /*!
   * Struct used by msgSend().
   */
  var objc_super = core.Struct({
    'receiver': 'pointer',
    'class': 'pointer'
  });

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
  Class.prototype.msgSend = function(sel, args, supre) {
    var msgtypes = this.getTypes(sel, args);
    var argTypes = msgtypes[1].slice(0), unwrappedArgs = [], unwrappedVals = null;
    var structRaw = null, structNew = null;
    var target = this;
    
    if(supre) { 
      target = new objc_super;
      target.receiver = this.pointer;
      target.class = this.getSuperclass().pointer;
    }

    if(core.Types.isStruct(msgtypes[0]) && 
        (structRaw = core.Types.getStruct(msgtypes[0])) &&
        structRaw.size > 16) 
    {
      structNew = new structRaw();
      msgtypes[0] = 'v';
      msgtypes[1].unshift(structNew);
      unwrappedArgs.push(structNew.ref());
    }

    var msgSendFunc = supre ? ( structNew ? core.get_objc_msgSendSuper_stret(msgtypes) 
                                          : core.get_objc_msgSendSuper(msgtypes)) 
                            : ( structNew ? core.get_objc_msgSend_stret(msgtypes) 
                                          : core.get_objc_msgSend(msgtypes));

    try {
      unwrappedArgs = unwrappedArgs.concat(core.unwrapValues([target, sel].concat(args), argTypes));
      unwrappedVals = msgSendFunc.apply(null, unwrappedArgs);

      if(!structNew) return core.wrapValue(unwrappedVals, msgtypes[0]);
      else return structNew;
    } catch (e) {
      if (!e.hasOwnProperty('stack')) throw exception.wrap(e);
      else throw e;
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
  Class.prototype.super = function() {
    var args = [];
    var sel = parseArgs(arguments, args);
    return this.msgSend(sel, args, true);
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
    if (!core.class_addIvar(this.classPointer, name, size, alignment, type))
      throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName());
    return this;
  }

  /* Proxy methods */
  Class.prototype.getName = function() { return core.class_getName(this.classPointer); }
  Class.prototype.isMetaClass = function() { return !!core.class_isMetaClass(this.classPointer); }
  Class.prototype.getInstanceSize = function() { return core.class_getInstanceSize(this.classPointer); }
  Class.prototype.getIvarLayout = function() { return core.class_getIvarLayout(this.classPointer); }
  Class.prototype.getVersion = function() { return core.class_getVersion(this.classPointer); }
  Class.prototype.setVersion = function(v) { return core.class_setVersion(this.classPointer, v); }
  Class.prototype.setSuperclass = function(superclass) { return Class.wrap(core.class_setSuperclass(this.classPointer, superclass.pointer)); }
  Class.prototype.getInstanceVariable = function(name) { return Class.wrap(core.class_getInstanceVariable(this.classPointer, name)); }
  Class.prototype.getClassVariable = function(name) { return ivar.wrap(core.class_getClassVariable(this.classPointer, name)); }
  Class.prototype.getInstanceMethod = function(sel) { return method.wrap(core.class_getInstanceMethod(this.classPointer, core.unwrapValue(sel,':'))); }
  Class.prototype.getClassMethod = function(sel) { return method.wrap(core.class_getClassMethod(this.classPointer, core.unwrapValue(sel, ':'))); }
  Class.prototype.getInstanceVariables = function() { return core.copyIvarList(this.pointer); }
  Class.prototype.getInstanceMethods = function() { return core.copyMethodList(this.pointer);  }

  /**
   * Accepts a SEL and queries the current object for the return type and
   * argument types for the given selector. If current object does not implment
   * that selector, then check the superclass, and repeat recursively until
   * a subclass that responds to the selector is found, or until the base class
   * is found.
   *
   * @api private
   */
  Class.prototype.getTypes = function(sel, args) {
    var method = this['get'+(this.isClass ? 'Class' : 'Instance')+'Method'](sel);
    var t = method ? method.getTypes() : null;
    if (!t) {
      // Unknown selector being send to object. This *may* still be valid, we
      // assume all args are type 'id' and return is 'id'.
      t = [ '@', [ '@', ':', ].concat(args.map(function () { return '@' })) ];
    }
    return t;
  }
  /**
   * Get's a Class instance's superclass. If the current class is a base class,
   * then this will return null.
   */
  Class.prototype.getSuperclass = function() {
    var superclassPointer = core.class_getSuperclass(this.classPointer);
    if (superclassPointer.isNull()) return null;
    return Class.wrap(superclassPointer);
  }

 /**
   * Returns an Array of Strings of the names of methods that the current object
   * will respond to. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` number argument.
   */
  Class.prototype.methods = function(maxDepth, sort) {
    var rtn=[], c=this, md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      console.assert(c.classPointer, 'class pointer is undefined. ',c.classPointer);
      var ms=core.copyMethodList(c.classPointer); i=ms.length;
      while (i--) if (!~rtn.indexOf(ms[i])) rtn.push(ms[i]);
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  }


  /*!
   * toString() override.
   */
  Class.prototype.toString = function() { return '[Class' + (this.isMetaClass() ? ' ◆' : '') +  ': ' + this.getName() + ']'; }

  // yellow
  Class.prototype.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }

  return Class;
})();