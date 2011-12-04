
/**
 * Represents an Objective-C class "ivar", or instance variable.
 */

/**
 * Module exports.
 */

exports.wrap = wrap
exports.Ivar = Ivar

/**
 * Module dependencies.
 */

var core = require('./core')
  , proto = Ivar.prototype

/**
 * Wraps a Pointer that should be an Objective-C ivar (instance variable), and
 * returns a new Ivar instance.
 */

function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Ivar(pointer)
}

/**
 * The `Ivar` Class. Wrapper around an Objective-C *ivar* pointer.
 */

function Ivar (pointer) {
  this.pointer = pointer
}

/**
 * Returns the name of the `Ivar`.
 */

proto.getName = function getName () {
  return core.ivar_getName(this.pointer)
}

/**
 * Returns the offset of the `Ivar`.
 */

proto.getOffset = function getOffset () {
  return core.ivar_getOffset(this.pointer)
}

/**
 * Returns the "type encoding" of the `Ivar`.
 */

proto.getTypeEncoding = function getTypeEncoding () {
  return core.ivar_getTypeEncoding(this.pointer)
}

proto.toString = function toString () {
  return '[Ivar: ' + [this.getName(), this.getTypeEncoding(), this.getOffset()].join(', ') +']'
}

proto.inspect = function inspect () {
  // red
  return '\033[31m' + this.toString() + '\033[39m'
}
