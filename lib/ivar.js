
/**
 * Represents an Objective-C class "ivar", or instance variable.
 */

/*!
 * Module exports.
 */

exports.wrap = wrap
exports.Ivar = Ivar

/*!
 * Module dependencies.
 */

var core = require('./core')
  , proto = Ivar.prototype

/**
 * Wraps a `Pointer` that should be an Objective-C `ivar` (instance variable),
 * and returns a new `Ivar` instance.
 *
 * @param {Pointer} pointer The ivar pointer to wrap.
 * @return {Ivar} A wrapper `Ivar` instance around the given iver pointer.
 */

function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Ivar(pointer)
}

/**
 * The `Ivar` Class. Wrapper around an Objective-C `ivar` pointer.
 */

function Ivar (pointer) {
  this.pointer = pointer
}

/**
 * Returns the name of the `Ivar`.
 *
 * @return {String} The name of this `Ivar`.
 */

proto.getName = function getName () {
  return core.ivar_getName(this.pointer)
}

/**
 * Returns the offset of the `Ivar`. This is the offset in bytes that the instance
 * variable resides in the object's layout in memory.
 *
 * @return {Number} The offset number of bytes of this `Ivar`.
 */

proto.getOffset = function getOffset () {
  return core.ivar_getOffset(this.pointer)
}

/**
 * Returns the "type encoding" of the `Ivar`.
 *
 * @return {String} The "type encoding" the this `Ivar`.
 */

proto.getTypeEncoding = function getTypeEncoding () {
  return core.ivar_getTypeEncoding(this.pointer)
}

/**
 * toString() override.
 */

proto.toString = function toString () {
  return '[Ivar: ' + [ this.getName()
                     , this.getTypeEncoding()
                     , this.getOffset()].join(', ') +']'
}

proto.inspect = function inspect () {
  // red
  return '\033[31m' + this.toString() + '\033[39m'
}
