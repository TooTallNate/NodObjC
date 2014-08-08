module.exports = (function() {
  /**
   * This 'core' module is the `libffi` wrapper. All required native
   * functionality is instantiated and then exported in this module.
   *
   * ### References:
   *
   *   * [Objective-C Runtime Reference](http://developer.apple.com/library/mac/#documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html)
   */

  /*!
   * Module dependencies.
   */

  var ref = require('ref')
    , ffi = require('ffi')
    , types = require('./types')
    , assert = require('assert')
    , struct = require('ref-struct')
    , exception = require('vm').runInNewContext('Error')
    // 'uintptr_t' isn't natively supported by node-ffi
    , uintptr_t = ref.sizeof.pointer == 8 ? 'uint64' : 'uint32'
    // TODO: These static ffi bindings could be replaced with native bindings
    //       for a speed boost.
    , libc = new ffi.Library('libc', {
        malloc: [ 'void*', [ 'size_t' ] ]
      , free: [ 'void', [ 'void*' ] ]
    })
    , free = libc.free
    , objc = new ffi.Library('libobjc', {
        class_addIvar: [ 'uint8', [ 'pointer', 'string', 'size_t', 'uint8', 'string' ] ]
      , class_addMethod: [ 'uint8', [ 'pointer', 'pointer', 'pointer', 'string' ] ]
      , class_addProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
      , class_copyIvarList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyMethodList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getClassMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getClassVariable: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getInstanceMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getInstanceSize: [ 'size_t', [ 'pointer' ] ]
      , class_getInstanceVariable: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getIvarLayout: [ 'string', [ 'pointer' ] ]
      , class_getName: [ 'string', [ 'pointer' ] ]
      , class_getProperty: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
      , class_getVersion: [ 'int32', [ 'pointer' ] ]
      , class_getWeakIvarLayout: [ 'string', [ 'pointer' ] ]
      , class_isMetaClass: [ 'uint8', [ 'pointer' ] ]
      , class_setIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
      , class_setSuperclass: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_setVersion: [ 'void', [ 'pointer', 'int32' ] ]
      , class_setWeakIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
      , ivar_getName: [ 'string', [ 'pointer' ] ]
      , ivar_getOffset: [ 'int32', [ 'pointer' ] ]
      , ivar_getTypeEncoding: [ 'string', [ 'pointer' ] ]
      , method_copyArgumentType: [ 'pointer', [ 'pointer', 'uint32' ] ]
      , method_copyReturnType: [ 'pointer', [ 'pointer' ] ]
      , method_exchangeImplementations: [ 'void', [ 'pointer', 'pointer' ] ]
      , method_getImplementation: [ 'pointer', [ 'pointer' ] ]
      , method_getName: [ 'pointer', [ 'pointer' ] ]
      , method_getNumberOfArguments: [ 'uint32', [ 'pointer' ] ]
      , method_getTypeEncoding: [ 'string', [ 'pointer' ] ]
      , method_setImplementation: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , objc_allocateClassPair: [ 'pointer', [ 'pointer', 'string', 'size_t' ] ]
      , objc_copyProtocolList: [ 'pointer', [ 'pointer' ] ]
      , objc_getAssociatedObject: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , objc_getClass: [ 'pointer', [ 'string' ] ]
      , objc_getClassList: [ 'int32', [ 'pointer', 'int32' ] ]
      , objc_getProtocol: [ 'pointer', [ 'string' ] ]
      , objc_registerClassPair: [ 'void', [ 'pointer' ] ]
      , objc_removeAssociatedObjects: [ 'void', [ 'pointer' ] ]
      , objc_setAssociatedObject: [ 'void', [ 'pointer', 'pointer', 'pointer', uintptr_t ] ]
      , object_getClass: [ 'pointer', [ 'pointer' ] ]
      , object_getClassName: [ 'string', [ 'pointer' ] ]
      , object_getInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
      , object_getIvar: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , object_setClass: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , object_setInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
      , object_setIvar: [ 'void', [ 'pointer', 'pointer', 'pointer' ] ]
      , property_getAttributes: [ 'string', [ 'pointer' ] ]
      , property_getName: [ 'string', [ 'pointer' ] ]
      , protocol_conformsToProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
      , protocol_copyMethodDescriptionList: [ 'pointer', [ 'pointer', 'uint8', 'uint8', 'pointer' ] ]
      , protocol_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , protocol_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , protocol_getMethodDescription: [ 'pointer', [ 'pointer', 'pointer', 'uint8', 'uint8' ] ]
      , protocol_getName: [ 'string', [ 'pointer' ] ]
      , protocol_getProperty: [ 'pointer', [ 'pointer', 'string', 'uint8', 'uint8' ] ]
      , sel_getName: [ 'string', [ 'pointer' ] ]
      , sel_registerName: [ 'pointer', [ 'string' ] ]
    })
    , objc_method_description = struct({ name: 'pointer', types: 'string' })
    , msgSendCache = {}
    , msgSendCacheSuper = {}
    , msgSendStretCache = {}
    , msgSendCacheSuperStret = {}
    , classCache = {}
    , selCache = {};
      objc.objc_msgSend = ffi.DynamicLibrary().get('objc_msgSend')
    , objc.objc_msgSend_stret = ffi.DynamicLibrary().get('objc_msgSend_stret')
    , objc.objc_msgSendSuper = ffi.DynamicLibrary().get('objc_msgSendSuper')
    , objc.objc_msgSendSuper_stret = ffi.DynamicLibrary().get('objc_msgSendSuper_stret');

  /**
   * A `toString()` override that mimics an `Error` object's `toString()`,
   * using the equivalent Objective-C `NSException` instance methods.
   *
   *     // `err` is a caught NSException instance
   *     err.toString()
   *     // 'NSInvalidArgumentException: *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil'
   */
  exception.prototype.toString = function() {
    return this('name') + ': ' + this('reason')
  }

  function dlopen (path) {
    return new ffi.DynamicLibrary(path)
  }

  /**
   * Convienience function to return an Array of Strings of the names of every
   * class currently in the runtime. This gets used at the during the import
   * process get a name of the new classes that have been loaded.
   * TODO: Could be replaced with a native binding someday for speed. Not overly
   *       important as this function is only called during import()
   */
  function getClassList () {
    // First get just the count
    var num = objc.objc_getClassList(null, 0), rtn = [];
    if (num > 0) {
      var c = null;
      var classes = new Buffer(ref.sizeof.pointer * num);

      objc.objc_getClassList(classes, num);

      for (var i=0; i<num; i++) {
        c = classes.readPointer(i * ref.sizeof.pointer);
        rtn.push(objc.class_getName(c));
      }
      // free() not needed since ffi allocated the buffer, and will free() with V8's GC
    }
    return rtn;
  }

  /**
   * Gets a list of the currently loaded Protocols in the runtime.
   */
  function copyProtocolList () {
    var rtn = []
      , protos = objc.objc_copyProtocolList(ref.alloc('uint'))
      , count = num.deref();

    for (var i=0; i<count; i++)
      rtn.push(objc.protocol_getName(protos.readPointer(i * ref.sizeof.pointer)));

    free(protos);
    return rtn;
  }

  /**
   * Copies and returns an Array of the instance variables defined by a given
   * Class pointer. To get class variables, call this function on a metaclass.
   */
  function copyIvarList (classPtr) {
    var rtn = []
      , ivars = objc.class_copyIvarList(classPtr, ref.alloc('uint'))
      , count = numIvars.deref();

    for (var i=0; i<count; i++) 
      rtn.push(objc.ivar_getName(ivars.readPointer(i * ref.sizeof.pointer)));

    free(ivars);
    return rtn;
  }

  /**
   * Copies and returns an Array of the instance methods the given Class pointer
   * implements. To get class methods, call this function with a metaclass.
   */
  function copyMethodList (classPtr) {
    var numMethods = ref.alloc('uint')
      , rtn = []
      , methods = objc.class_copyMethodList(classPtr, numMethods)
      , count = numMethods.deref();

    for (var i=0; i<count; i++)
      rtn.push(wrapValue(objc.method_getName(methods.readPointer(i * ref.sizeof.pointer)),':'));
    
    free(methods);
    return rtn;
  }

  /**
   * Iterates over the Methods defined by a Protocol.
   */
  function copyMethodDescriptionList (protocolPtr, required, instance) {
    var numMethods = ref.alloc('uint')
      , methods = objc.protocol_copyMethodDescriptionList(protocolPtr, required, instance, numMethods)
      , rtn = []
      , p = methods
      , count = numMethods.deref();

    for (var i=0; i<count; i++) {
      var cur = new objc_method_description(p);
      rtn.push(SEL.toString(cur.name));
      p = p.seek(ffi.sizeOf(objc_method_description));
    }
    free(methods);
    return rtn;
  }

  /**
   * Convienience function to get the String return type of a Method pointer.
   * Takes care of free()ing the returned pointer, as is required.
   */
  function getMethodReturnType (method) {
    return getStringAndFree(objc.method_copyReturnType(method));
  }

  function getMethodArgTypes (method) {
    var num = objc.method_getNumberOfArguments(method)
      , rtn = [];
    for (var i=2; i<num; i++)
      rtn.push(getStringAndFree(objc.method_copyArgumentType(method, i)));
   return rtn;
  }

  function getStringAndFree (ptr) {
    var str = ptr.readCString();
    free(ptr);
    return str;
  }

  function getException(pointer) {
    w = wrapValue(pointer,'@');
    w.__proto__ = exception.prototype;
    // `name` is non-configurable on Functions, so don't bother
    w.message = String(w('reason'))
    Error.captureStackTrace(w, getException);
    return w;
  }

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
   * Wraps up a node-ffi pointer if needed (not needed for Numbers, etc.)
   */
  function wrapValue (val, type) {
    if (val === null || (val.isNull && val.isNull())) return null;
    var strtype = type.type ? type.type : type;

    if (type.function_pointer && strtype == '@?')
      return createBlock(val, type);
    else if(type.function_pointer && strtype != '@?')
      return createUnwrapperFunction(val, type);
    else if (strtype == '@' || strtype == '#') {
      // See if this pointer already has an ID (or even a Class) associated with it.
      var wrappedObj, cache = objc.objc_getAssociatedObject(val, ex.objcStorageKey);
      if(!cache.isNull() && (wrappedObj = cache.readObject(0)) && wrappedObj ) {
        return wrappedObj;
      } else {
        //TODO: Decouple this...
        if(strtype=='@') {
          var ID = require('./id');
          wrappedObj = new ID(val);
        } else {
          var Class = require('./Class');
          wrappedObj = new Class(val);
        }
        var rtn = function() {
          var args = [], sel = objc.parseArgs(arguments,args);
          return wrappedObj.msgSend(sel,args,false);
        }
        rtn.__proto__ = wrappedObj;
        if(strtype=='#') {
          // Store the object we created as part of the pointer defined.
          var refn = new ref.alloc('Object');
          refn.free = false;
          refn.writeObject(rtn, 0);
          objc.objc_setAssociatedObject(val, ex.objcStorageKey, refn, 0);
        }
        return rtn;
      }
    } else if (strtype == ':')
      return selToString(val);
    else if (strtype == 'B')
      return val ? true : false;
    else if (strtype === 'c' && val === 1)
      return true;
    else if (strtype === 'c' && val === 0)
      return false;
    return val;
  }

  /**
   * Accepts an Array of raw objc pointers and other values, and an array of ObjC
   * types, and returns an array of wrapped values where appropriate.
   */
  function wrapValues (values, objtypes) {
    var len = values.length;
    var rtn = [];
    for (var i=0; i<len; i++)
      rtn.push(wrapValue(values[i], objtypes[i]));
    return rtn;
  }

  /**
   * Unwraps a previously wrapped NodObjC object.
   */
  function unwrapValue (val, type) {
    var strtype = type.type ? type.type : type;
    if (type.function_pointer && strtype == '@?')
      return readBlockPointer(val, type);
    else if (type.function_pointer && strtype != '@?')
      return createWrapperPointer(val, type);
    else if (strtype == '@' || strtype == '#') {
      if (!val) return null;
      return val.pointer;
    } else if (strtype == ':')
      return toSEL(val);
   return val;
  }

  /**
   * Accepts an Array of wrapped NodObjC objects and other values, and an array
   * of their cooresponding ObjC types, and returns an array of unwrapped values.
   */
  function unwrapValues (values, objtypes) {
    var rtn = [];
    objtypes.forEach(function(item,index,arr) { 
      rtn.push(unwrapValue(values[index], objtypes[index])); 
    });
    return rtn;
  }

  /**
   * Transforms a JS String selector into a `SEL` pointer reference.
   * This function does caching internally.
   *
   * @param {String} sel A String selector to turn into a native SEL pointer.
   * @return {Pointer} The SEL pointer that was generated, or a cached version.
   * @api private
   */
  function toSEL (sel) {
    var rtn = selCache[sel];
    if (rtn) return rtn;
    return selCache[sel] = objc.sel_registerName(sel);
  }

  /**
   * Transforms a `SEL` reference to a JS String.
   *
   * @param {Pointer} SEL the SEL Pointer to turn into a JS String.
   * @return {String} The String value of the given SEL.
   * @api private
   */
  function selToString (SEL) {
    return objc.sel_getName(SEL);
  }

  /**
   * Represents a wrapped `IMP` (a.k.a. method implementation). `IMP`s are function pointers for methods. The first two arguments are always:
   *
   *   1. `self` - The object instance the method is being called on.
   *   2. `_cmd` - The `SEL` selector of the method being invoked.
   *
   * Any additional arguments that get passed are the actual arguments that get
   * passed along to the method.
   */

  /**
   * Creates an ffi Function Pointer to the passed in 'func' Function. The
   * function gets wrapped in an "wrapper" function, which wraps the passed in
   * arguments, and unwraps the return value.
   *
   * @param {Function} A JS function to be converted to an ffi C function.
   * @param {Object|Array} A "type" object or Array containing the 'retval' and
   *                       'args' for the Function.
   * @api private
   */
  function createWrapperPointer (func, type) {
    var argTypes = type.args || type[1] || [];
    var rtnType = type.retval || type[0] || 'v';
    var ffiDef = types.mapArray(argTypes);

    if (func.pointer) return func.pointer;

    return new ffi.Callback(types.map(rtnType), ffiDef, function() {
      return unwrapValue(func.apply(null, wrapValues(arguments, argTypes)), rtnType);              
    });
  }

  /**
   * Creates a JS Function from the passed in function pointer. When the returned
   * function is invoked, the passed in arguments are unwrapped before being
   * passed to the native function, and the return value is wrapped up before
   * being returned for real.
   *
   * @param {Pointer} The function pointer to create an unwrapper function around
   * @param {Object|Array} A "type" object or Array containing the 'retval' and
   *                       'args' for the Function.
   * @api private
   */
  function createUnwrapperFunction (funcPtr, type) {
    var rtnType = type.retval || type[0] || 'v';
    var argTypes = type.args || type[1] || [];

    var func = ffi.ForeignFunction(funcPtr, types.map(rtnType), types.mapArray(argTypes));
    function unwrapper () {
      return wrapValue(func.apply(null, unwrapValues(arguments, argTypes)), rtnType);
    }
    unwrapper.retval = rtnType;
    unwrapper.args = argTypes;
    unwrapper.pointer = funcPtr;
    return unwrapper;
  }

  /**
   * Creates a JS Function from the passed in function pointer. When the returned
   * function is invoked, the passed in arguments are unwrapped before being
   * passed to the native function, and the return value is wrapped up before
   * being returned for real. This support variadic functions such as printf()
   *
   * @param {Pointer} The function pointer to create an unwrapper function around
   * @param {Object|Array} A "type" object or Array containing the 'retval' and
   *                       'args' for the Function.
   * @api private
   */
  function createUnwrapperFunctionVar (funcPtr, type) {
    var rtnType = type.retval || type[0] || 'v';
    var argTypes = type.args || type[1] || [];
    var generator = ffi.VariadicForeignFunction(funcPtr, types.map(rtnType), types.mapArray(argTypes));

    function unwrapper() {
      var newtypes = [];
      if(this.types) {
        newtypes = this.types[1].slice(this.types[1].length - (arguments.length - argTypes.length));
        rtnType = this.types[0];
      } else {
        // Detect the types coming in, make sure to ignore previously defined baseTypes,
        // garner a list of these then send the function through the normal exec.
        // The types system in objc, should probably be cleaned up considerably. This is
        // somewhat faulty but since 95% of objects coming through are mostly ID/Class
        // it works, we may have issues for function pointers/etc. 
        for(var i=argTypes.length; i < arguments.length; i++) {
          if(arguments[i].type) newtypes.push(arguments[i].type)
          else if(arguments[i].pointer) newtypes.push('@');
          else if(arguments[i].function_pointer) newtypes.push('@?');
          else if(typeof arguments[i] == 'string') newtypes.push('r*');
          else if(typeof arguments[i] == 'number') newtypes.push('d');
          else newtypes.push('?');
        }
      }
      return wrapValue(generator
                        .apply(null, types.mapArray(newtypes))
                        .apply(null, unwrapValues(arguments,argTypes.concat(newtypes))),
                      rtnType);
    }
    unwrapper.retval = rtnType;
    unwrapper.args = argTypes;
    unwrapper.pointer = funcPtr;
    return unwrapper;
  }


  /**
   * We have to simulate what the llvm compiler does when it encounters a Block
   * literal expression (see `Block-ABI-Apple.txt` above).
   * The "block literal" is the struct type for each Block instance.
   */
  var __block_literal_1 = struct({
    isa: 'pointer',
    flags: 'int32',
    reserved: 'int32',
    invoke: 'pointer',
    descriptor: 'pointer'
  });

  /**
   * The "block descriptor" is a static singleton struct. Probably used in more
   * complex Block scenarios involving actual closure variables needing storage
   * (in `NodObjC`, JavaScript closures are leveraged instead).
   */
  var __block_descriptor_1 = struct({
    reserved: 'ulonglong',
    Block_size: 'ulonglong'
  });

  var BD = new __block_descriptor_1();
  BD.reserved = 0;
  BD.Block_size = __block_literal_1.size;

  // The class of the block instances; lazy-loaded
  var CGB;

  /**
   * Creates a C block instance from a JS function and returns it's pointer.
   *
   * @api private
   */
  function createBlockPointer (func, type) {
    if (!func) return null;
    var bl = new __block_literal_1;
    // Set the class of the instance
    bl.isa = CGB || (CGB = core.process.get('_NSConcreteGlobalBlock'));
    // Global flags
    bl.flags = 1 << 29;
    bl.reserved = 0;
    bl.invoke = createWrapperPointer(func, type);
    bl.descriptor = BD.ref();
    return bl.ref();
  }


  /**
   * Creates a C block instance from a JS Function.
   * Blocks are regular Objective-C objects in Obj-C, and can be sent messages;
   * thus Block instances need are creted using the core.wrapId() function.
   *
   * @api private
   */
  function createBlock (func, type) {
    return wrapId(createBlockPointer(func, type));
  }

  /**
   * Gets an ffi pointer to a C block from an existing wrapped Block instance, or
   * creates a new block with _createBlock(). The second case should be most common
   * since it will be rare to create your own Block intstances and pass them around.
   *
   * @api private
   */
  function getBlockPointer (blockOrFunc, type) {
    if ('pointer' in blockOrFunc)
      return blockOrFunc.pointer;
    else
      return createBlockPointer(blockOrFunc, type);
  }


  /*!
   * Module exports.
   */

  // Expose `node-ffi` stuff so we don't have to require node-ffi elsewhere
  var ex = objc;
  ex.parseArgs = parseArgs;
  ex.createBlock = createBlock;
  ex.getBlockPointer = getBlockPointer;
  ex.createUnwrapperFunction = createUnwrapperFunction;
  ex.createUnwrapperFunctionVar = createUnwrapperFunctionVar;
  ex.createWrapperPointer = createWrapperPointer;
  ex.toSEL = toSEL;
  ex.selToString = selToString;
  ex.Struct = struct;
  ex.Callback = ffi.Callback;
  ex.ForeignFunction = ffi.ForeignFunction;
  ex.Types = types;
  ex.REF = ref;
  ex.dlopen = dlopen;
  ex.process = dlopen();
  ex.getClassList = getClassList;
  ex.copyProtocolList = copyProtocolList;
  ex.copyIvarList = copyIvarList;
  ex.copyMethodList = copyMethodList;
  ex.copyMethodDescriptionList = copyMethodDescriptionList;
  ex.getMethodReturnType = getMethodReturnType;
  ex.getMethodArgTypes = getMethodArgTypes;
  ex.getStringAndFree = getStringAndFree;
  ex.objc_method_description = objc_method_description;
  ex.wrapValue = wrapValue;
  ex.wrapValues = wrapValues;
  ex.unwrapValues = unwrapValues;
  ex.unwrapValue = unwrapValue;
  ex.objcStorageKey = new Buffer(1);
  ex.getException = getException;
  return ex;
})();