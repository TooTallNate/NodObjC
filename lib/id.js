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
    , Class = require('./class')


  function ID(pointer, classPointer) {
    if(!classPointer) Class.call(this, core.object_getClass(pointer));
    else Class.call(this, classPointer);
    this.pointer = pointer;
    this.isClass = false;
    this.type = '@';
  }
  ID.prototype = Object.create(Class.prototype);
  ID.prototype.constructor = ID;

  /**
   * Wraps up a pointer that is expected to be a compatible Objective-C
   * object that can recieve messages. This function returns a cached version of the
   * wrapped function after the first time it is invoked on a given Pointer, using
   * Objective-C's internal association map for objects.
   *
   * @api private
   */

  ID.wrap = function(pointer, classPointer) {
    console.assert(typeof(pointer) != 'undefined' && pointer !== 0 && pointer.address() !== 0, 'pointer passed in was null ', pointer, pointer.address());

    // See if this pointer already has an ID (or even a Class) associated with it.
    var cache = core.objc_getAssociatedObject(pointer, core.objcStorageKey);
    if(!cache.isNull())
      return cache.readObject(0);

    // create a new ID for this pointer.
    var newID = new ID(pointer, classPointer);
    var rtn = function() {
      var args = [];
      var sel = core.parseArgs(arguments,args);
      return newID.msgSend(sel,args,false);
    }
    rtn.__proto__ = newID;

    // Store the object we created as part of the pointer defined.
    var ref = new core.REF.alloc('Object');
    ref.free = false;
    ref.writeObject(rtn, 0);
    core.objc_setAssociatedObject(pointer, core.objcStorageKey, ref, 0);

    return rtn;
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
