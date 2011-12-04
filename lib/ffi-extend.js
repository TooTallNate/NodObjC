
/**
 * Module dependencies.
 */

var ffi = require('node-ffi')
  , core = require('./core')
  , types = require('./types')
  , Pointer = ffi.Pointer
  , SIZE_MAP = ffi.Bindings.TYPE_SIZE_MAP
  , FUNC_MAP = ffi.TYPE_TO_POINTER_METHOD_MAP

/**
 * We include a polyfil for `process.arch` on node 0.4.x.
 */

if (!('arch' in process)) {
  process.arch = ffi.Bindings.POINTER_SIZE == 8 ? 'x64' : 'ia32'
}

/**
 * Returns a new Pointer that points to this pointer.
 * Equivalent to the "address of" operator:
 *
 *     type* = &ptr
 */

Pointer.prototype.ref = function ref () {
  var ptr = new Pointer(SIZE_MAP.pointer)
  ptr.putPointer(this)
  ptr._type = '^' + this._type
  return ptr
}

/**
 * Dereferences the pointer. Includes wrapping up id instances when necessary.
 * Equivalent to the "value at" operator:
 *
 *     type = *ptr
 */

Pointer.prototype.deref = function deref () {
  var t = this._type
  if (t[0] !== '^') throw new Error('cannot dereference non-pointer')
  // since we're dereferencing, remove the leading ^ char
  t = t.substring(1)
  var ffiType = types.map(t)
    , val = null
  if (!ffiType) throw new Error('cannot determine type: ' + t)
  if (ffi.isStructType(ffiType)) {
    val = new ffiType(this)
  } else {
    val = this['get' + FUNC_MAP[ffiType] ]()
  }
  val._type = t
  return core.wrapValue(val, t)
}
