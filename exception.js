/**
 * Creates a JS Error object from an NSException pointer.
 */
var id = require('./id')
  , Err = require('vm').runInNewContext('Error')

var proto = exports.proto = Err.prototype
// Make the Error objects inherit from our id class
proto.__proto__ = id.proto

exports.wrap = function wrap (pointer) {
  var w = id.wrap(pointer)
  w.__proto__ = proto
  // `name` is non-configurable on Functions, so don't bother
  w.message = String(w('reason'))
  Err.captureStackTrace(w, exports.wrap)
  return w
}

/**
 * Make a toString override that mimics V8's Error object's toString()
 */
proto.toString = function toString () {
  return this('name') + ': ' + this('reason')
}
