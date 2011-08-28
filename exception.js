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
  // We have to do a little workaround to get a nice 'stack' property, since
  // the 'name' property on the id wraps is non-configurable
  var stacker = new Error(String(w('reason')))
  stacker.name = String(w('name'))
  Err.captureStackTrace(stacker, exports.wrap)
  Object.defineProperty(w, 'stack', Object.getOwnPropertyDescriptor(stacker, 'stack'))
  return w
}
