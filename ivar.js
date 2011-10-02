/**
 * Represents an Objective-C class "ivar", or instance variable.
 */

exports.wrap = wrap
exports.Ivar = Ivar

var core = require('./core')
  , proto = Ivar.prototype

function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Ivar(pointer)
}

function Ivar (pointer) {
  this.pointer = pointer
}

proto.getName = function getName () {
  return core.ivar_getName(this.pointer)
}

proto.getOffset = function getOffset () {
  return core.ivar_getOffset(this.pointer)
}

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
