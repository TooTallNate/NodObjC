
/**
 * Creates a JavaScript `Error` object from an Objective-C `NSException` pointer.
 * You will not need to use any of these functions in your own code; NodObjC uses
 * these internally.
 */

/*!
 * Module exports.
 */

exports.wrap = wrap

/*!
 * Module dependencies.
 */

var Err = require('vm').runInNewContext('Error')
  , proto = exports.proto = Err.prototype
  , id = require('./id')

/*!
 * Make the Error objects inherit from the `id` class.
 */

proto.__proto__ = id.proto

/**
 * Wraps a `Pointer` that should be an Objective-C `NSException` instance.
 */

function wrap (pointer) {
  var w = id.wrap(pointer)
  w.__proto__ = proto
  // `name` is non-configurable on Functions, so don't bother
  w.message = String(w('reason'))
  Err.captureStackTrace(w, exports.wrap)
  return w
}

/**
 * A `toString()` override that mimics an `Error` object's `toString()`.
 */

proto.toString = function toString () {
  return this('name') + ': ' + this('reason')
}
