/**
 * This 'core' module is the `libffi` wrapper. All required native
 * functionality is instaniated and then exported in this module.
 */

var ffi = require('node-ffi')
  , types = require('./types')
  , SEL = require('./sel')
  // TODO: These static ffi bindings could be replaced with native bindings
  //       for a speed boost.
  , objc = new ffi.Library('libobjc', {
      class_copyMethodList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getClassMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getInstanceMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getInstanceSize: [ 'size_t', [ 'pointer' ] ]
    , class_getName: [ 'string', [ 'pointer' ] ]
    , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
    , class_getVersion: [ 'pointer', [ 'pointer' ] ]
    , method_getName: [ 'pointer', [ 'pointer' ] ]
    , method_copyReturnType: [ 'pointer', [ 'pointer' ] ]
    , method_copyArgumentType: [ 'pointer', [ 'pointer', 'uint32' ] ]
    , method_getNumberOfArguments: [ 'uint32', [ 'pointer' ] ]
    , objc_allocateClassPair: [ 'pointer', [ 'pointer', 'string', 'size_t' ] ]
    , objc_getClass: [ 'pointer', [ 'string' ] ]
    , objc_getClassList: [ 'int32', [ 'pointer', 'int32' ] ]
    , object_getClass: [ 'pointer', [ 'pointer' ] ]
    , object_getClassName: [ 'string', [ 'pointer' ] ]
    , sel_registerName: [ 'pointer', [ 'string' ] ]
    , sel_getName: [ 'string', [ 'pointer' ] ]
  })
  , msgSendCache = {}

exports.__proto__ = objc;

exports.Pointer = ffi.Pointer;

exports.dlopen = function dlopen (path) {
  return new ffi.DynamicLibrary(path);
}

exports.process = exports.dlopen();

/**
 * Convienience function to return an Array of Strings of the names of every
 * class currently in the runtime. This gets used at the during the import
 * process get a name of the new classes that have been loaded.
 * TODO: Could be replaced with a native binding someday for speed. Not overly
 *       important as this function is only called during import()
 */
exports.getClassList = function getClassList () {
  // First get just the count
  var num = objc.objc_getClassList(null, 0)
    , rtn = []
  if (num > 0) {
    var s = ffi.Bindings.TYPE_SIZE_MAP.pointer
      , c = null
      , classes = new ffi.Pointer(s * num)
      , cursor = classes
    objc.objc_getClassList(classes, num);
    for (var i=0; i<num; i++) {
      c = cursor.getPointer()
      rtn.push(objc.class_getName(c));
      cursor = cursor.seek(s);
    }
    // free() not needed since ffi allocated the buffer, and will free() with V8's GC
  }
  return rtn;
}

/**
 * Convienience function to get the String return type of a Method pointer.
 * Takes care of free()ing the returned pointer, as is required.
 */
exports.getMethodReturnType = function getMethodReturnType (method) {
  return getStringAndFree(objc.method_copyReturnType(method));
}

exports.getMethodArgTypes = function getMethodArgTypes (method) {
  var num = objc.method_getNumberOfArguments(method)
    , rtn = []
  for (var i=2; i<num; i++) {
    rtn.push(getStringAndFree(objc.method_copyArgumentType(method, i)));
  }
  return rtn;
}

function getStringAndFree (ptr) {
  var str = ptr.getCString()
  exports.free(ptr);
  return str;
}

// Creates and/or returns an appropriately wrapped up 'objc_msgSend' function
// based on the given Method description info.
exports.get_objc_msgSend = function get_objc_msgSend (objcTypes) {
  var type = ['pointer', 'pointer'] // id and SEL
    , rtn = [ types.map(objcTypes[0]), type ]
    , args = objcTypes[1]
    , i = 0
    , l = args.length
  for (; i<l; i++) {
    type.push(types.map(args[i]));
  }
  // Stringify the types
  var key = rtn.toString();
  //console.warn('INFO: types key: %s', key);

  // first check the cache
  if (msgSendCache[key]) return msgSendCache[key];
  //console.warn('WARN: key not found in cache, generating new copy: %s', key);

  // If we got here, then create a new objc_msgSend ffi wrapper
  // TODO: Don't use the Library helper, use ffi low-level API
  var lib = new ffi.Library(null, {
    objc_msgSend: rtn
  })
  // return and cache at the same time
  return msgSendCache[key] = lib.objc_msgSend;
}


exports.Function = function buildFunction (name, rtnType, argTypes, async, lib) {
  lib || (lib = exports.process);
  try {
    var symbol = lib.get(name);
    if (symbol.isNull()) throw new Error('Symbol not found: ' + name);
    return ffi.ForeignFunction.build(symbol, rtnType, argTypes, async);
  } catch (e) {
    //console.error(name, e.message);
  }
}

// Wrap the global free() function. Some of the ObjC runtime objects need
// explicit freeing.
exports.free = exports.Function('free', 'void', [ 'pointer' ], false);


exports.wrapValue = function wrapValue (val, type) {
  //console.error('wrapValue(): %s, %s', val, type);
  if (val === null || (val.isNull && val.isNull())) return null;
  var rtn = val;
  if (type == '@') {
    rtn = exports._idwrap(val);
  } else if (type == '#') {
    rtn = exports._getClass(objc.class_getName(val));
  } else if (type == ':') {
    rtn = SEL.toString(val);
  } else if (type == 'B') {
    rtn = val ? true : false;
  }
  return rtn;
}

exports.unwrapValue = function unwrapValue (val, type) {
  //console.error('unwrapValue(): %s, %s', val, type);
  var rtn = val;
  if (type == '@' || type == '#') {
    rtn = val.pointer;
  } else if (type == ':') {
    rtn = SEL.toSEL(val);
  }
  return rtn;
}
