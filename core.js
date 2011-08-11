/**
 * This 'core' module is the `libffi` wrapper. All required native
 * functionality is instaniated and then exported in this module.
 */

var ffi = require('node-ffi')
  // TODO: These static ffi bindings could be replaced with native bindings
  //       for a speed boost.
  , objc = new ffi.Library(null, {
      objc_getClass: [ 'pointer', [ 'string' ] ]
    , class_copyMethodList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getName: [ 'string', [ 'pointer' ] ]
    , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
    , class_getVersion: [ 'pointer', [ 'pointer' ] ]
    , method_getName: [ 'pointer', [ 'pointer' ] ]
    , method_copyReturnType: [ 'pointer', [ 'pointer' ] ]
    , method_copyArgumentType: [ 'pointer', [ 'pointer', 'uint32' ] ]
    , method_getNumberOfArguments: [ 'uint32', [ 'pointer' ] ]
    , objc_getClassList: [ 'int32', [ 'pointer', 'int32' ] ]
    , object_getClass: [ 'pointer', [ 'pointer' ] ]
    , sel_registerName: [ 'pointer', [ 'string' ] ]
    , sel_getName: [ 'string', [ 'pointer' ] ]
    , free: [ 'void', [ 'pointer' ] ]
  })
  , msgSendCache = {}

exports.__proto__ = objc;

exports.Pointer = ffi.Pointer;

exports.dlopen = function dlopen (path) {
  return new ffi.DynamicLibrary(path);
}

// Creates and/or returns an appropriately wrapped up 'objc_msgSend' function
// based on the given Method description info.
exports.get_objc_msgSend = function get_objc_msgSend (args) {
  var type = ['pointer', 'pointer'] // id and sel
    , types = [ objcToFfi(info.retval), type ]
    , i = 0
    , l = info.args.length
  for (; i<l; i++) {
    type.push(objcToFfi(info.args[i]));
  }
  // Stringify the types
  var key = types.toString();
  console.warn('INFO: types key: %s', key);

  // first check the cache
  if (msgSendCache[key]) return msgSendCache[key];
  console.warn('WARN: key not found in cache, generating new copy: %s', key);

  // If we got here, then create a new objc_msgSend ffi wrapper
  var lib = new ffi.Library(null, {
    objc_msgSend: types
  })
  // return and cache at the same time
  return msgSendCache[key] = lib.objc_msgSend;
}

// convert an Objective-C 'type' into an 'ffi' type. This is an important
// function and the logic of it is reused throughout the message-passing logic
// in 'Id.js'.
var objcFfiMap = {
    'id': 'pointer'
  , 'void': 'void'
  , 'oneway void': 'void' // wtf?
  , 'Class': 'pointer'
  , 'BOOL': 'char'
  , 'NSInteger': 'int32'
  , 'NSUInteger': 'uint32'
};
function objcToFfi (type) {
  var t = objcFfiMap[type.declared_type];
  if (!t && /char\*/.test(type.declared_type))
    return 'string';
  if (!t && /\*/.test(type.declared_type))
    return 'pointer';
  // TODO: Add more robust conversions here
  if (!t) throw new Error("Can't determine conversion type: "+type.declared_type);
  return t;
}
exports.objcToFfi = objcToFfi;
