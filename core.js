var ffi = require('node-ffi')
  , objc = new ffi.Library(null, {
      objc_getClass: [ 'pointer', [ 'string' ] ]
    , class_getName: [ 'string', [ 'pointer' ] ]
    , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
    , sel_registerName: [ 'pointer', [ 'string' ] ]
    , sel_getName: [ 'string', [ 'pointer' ] ]
  })
  , msgSendCache = {}

for (var i in objc) exports[i] = objc[i]

exports.dlopen = function dlopen (path) {
  return new ffi.DynamicLibrary(path);
}

// Creates and/or returns an appropriately wrapped up 'objc_msgSend' function
// based on the given Method description info.
exports.get_objc_msgSend = function get_objc_msgSend (info) {
  var key = [ info.retval.type ]
    , type = ['pointer', 'pointer']
    , types = [ objcToFfi(info.retval), type ]
    , i = 0
    , l = info.args.length
  for (; i<l; i++) {
    type.push(objcToFfi(info.args[i]));
    key.push(info.args[i].type);
  }
  // Stringify the key
  key = key.join('');
  //console.error('msgSend key: %s', key);

  // first check the cache
  if (msgSendCache[key]) return msgSendCache[key];

  // If we got here, then create a new objc_msgSend ffi wrapper
  var lib = new ffi.Library(null, {
    objc_msgSend: types
  })
  // return and cache at the same time
  return msgSendCache[key] = lib.objc_msgSend;
}

// convert an Objective-C 'type' into an 'ffi' type
var objcFfiMap = {
    'id': 'pointer'
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
  if (!t) throw new Error("Can't determine conversion type");
  return t;
}
