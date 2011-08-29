/**
 * Represents an Objective-C class "ivar", or instance variable.
 */

var core = require('./core')

exports.wrap = function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Ivar(pointer)
}

function Ivar (pointer) {
  this.pointer = pointer
}
exports.Ivar = Ivar

var proto = Ivar.prototype

proto.getName = function getName () {
  return core.ivar_getName(this.pointer)
}

proto.getOffset = function getOffset () {
  return core.ivar_getOffset(this.pointer)
}

proto.getTypeEncoding = function getTypeEncoding () {
  return core.ivar_getTypeEncoding(this.pointer)
}
