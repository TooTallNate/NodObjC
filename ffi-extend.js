var ffi = require('node-ffi')
  , core = require('./core')
  , types = require('./types')
  , Pointer = ffi.Pointer
  , SIZE_MAP = ffi.Bindings.TYPE_SIZE_MAP
  , FUNC_MAP = ffi.TYPE_TO_POINTER_METHOD_MAP

/**
 * Returns a new Pointer that points to this pointer.
 * Equivalent to the "address of" operator:
 *   type* = &ptr
 */
Pointer.prototype.ref = function ref () {
  var ptr = new Pointer(SIZE_MAP.pointer)
  ptr.setPointer(this)
  return ptr
}

/**
 * Dereferences the pointer. Includes wrapping up id instances when necessary.
 * Accepts a "type" argument, but that is attempted to be determined
 * automatically by the _type prop if it exists.
 * Equivalent to the "value at" operator:
 *   type = *ptr
 */
Pointer.prototype.deref = function deref (type) {
  var t = type || this._type
    , ffiType = types.map(t)
    , val = this['get' + FUNC_MAP[ffiType] ]()
  return core.wrapValue(val, t)
}
