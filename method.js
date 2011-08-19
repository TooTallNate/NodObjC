/**
 * Represents an Objective-C "Method" instance. These do not respond to regular
 * messages, so it does not inherit from idWrap
 */
var core = require('./core')
  , IMP = require('./imp')
  , SEL = require('./sel')

exports.wrap = function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Method(pointer)
}

function Method (pointer) {
  this.pointer = pointer
}
exports.Method = Method

var proto = Method.prototype;

proto.getArgumentType = function getArgumentType (index) {
  var ptr = core.method_copyArgumentType(this.pointer, index)
    , str = ptr.getCString()
  core.free(ptr)
  return str
}

proto.getArgumentTypes = function getArgumentTypes () {
  var rtn = []
    , len = this.getNumberOfArguments()
  for (var i=0; i<len; i++) {
    rtn.push(this.getArgumentType(i))
  }
  //console.error(rtn)
  return rtn
}

proto.getReturnType = function getReturnType () {
  var ptr = core.method_copyReturnType(this.pointer)
    , str = ptr.getCString()
  core.free(ptr)
  //console.error(str)
  return str
}

proto.getTypes = function getTypes () {
  return [ this.getReturnType(), this.getArgumentTypes() ]
}

proto.exchangeImplementations = function exchangeImplementations (other) {
  return this._exchangeImplementations(other.pointer)
}

proto._exchangeImplementations = function exchangeImplementations (otherPointer) {
  return core.method_exchangeImplementations(this.pointer, otherPointer)
}

proto.getImplementation = function getImplementation () {
  return IMP.createUnwrapperFunction(core.method_getImplementation(this.pointer), this.getTypes())
}

proto.getName = function getName () {
  return SEL.toString(core.method_getName(this.pointer))
}

proto.getNumberOfArguments = function getNumberOfArguments () {
  return core.method_getNumberOfArguments(this.pointer)
}

proto.getTypeEncoding = function getTypeEncoding () {
  return core.method_getTypeEncoding(this.pointer)
}

proto.setImplementation = function setImplementation (func) {
  var types = this.getTypes()
    , wrapperPtr = IMP.createWrapperPointer(func, types)
    , oldFuncPointer = core.method_setImplementation(this.pointer, wrapperPtr)
  return IMP.createUnwrapperFunction(oldFuncPointer, types)
}

proto.toString = function toString () {
  return '[Method: '+this.getName()+' '+this.getReturnType()+'('+this.getArgumentTypes()+') ]'
}

proto.inspect = function inspect () {
  // magenta
  return '\033[35m' + this.toString() + '\033[39m'
}
