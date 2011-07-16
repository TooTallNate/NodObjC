var ffi = require('node-ffi')
  , objc = new ffi.Library(null, {
      objc_getClass: [ 'pointer', [ 'string' ] ]
    , class_getName: [ 'string', [ 'pointer' ] ]
    , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
    , sel_registerName: [ 'pointer', [ 'string' ] ]
    , sel_getName: [ 'string', [ 'pointer' ] ]
  })

for (var i in objc) exports[i] = objc[i]

exports.dlopen = function dlopen (path) {
  return new ffi.DynamicLibrary(path);
}
