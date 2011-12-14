
/**
 * Represents an Objective-C "Method" instance. These do not respond to regular
 * messages, so it does not inherit from idWrap
 */

/*!
 * Module exports.
 */

exports.wrap = wrap
exports.Method = Method

/*!
 * Module dependencies.
 */

var core = require('./core')
  , IMP = require('./imp')
  , SEL = require('./sel')
  , proto = Method.prototype

/**
 * Returns a new `Method` instance wrapping the given `pointer`.
 *
 * @param {Pointer} pointer The pointer to wrap.
 * @return {Method} The new `Method` instance.
 */

function wrap (pointer) {
  if (pointer.isNull()) return null
  return new Method(pointer)
}

/**
 * `Method` class constructor.
 */

function Method (pointer) {
  this.pointer = pointer
}

/**
 * Returns the "argument type" string, for the given argument `index`.
 *
 * @param {Number} index The argument index to lookup.
 * @return {String} The "type encoding" of the given argument index.
 */

proto.getArgumentType = function getArgumentType (index) {
  var ptr = core.method_copyArgumentType(this.pointer, index)
    , str = core.getStringAndFree(ptr)
  return str
}

/**
 * Returns an Array of all "argument types" for this method.
 *
 * @return {Array} An Array of all the method arguments' "type encodings".
 */

proto.getArgumentTypes = function getArgumentTypes () {
  var rtn = []
    , len = this.getNumberOfArguments()
  for (var i=0; i<len; i++) {
    rtn.push(this.getArgumentType(i))
  }
  return rtn
}

/**
 * Returns the "type encoding" of the method's return value.
 *
 * @return {String} The "type encoding" of the return value.
 */

proto.getReturnType = function getReturnType () {
  var ptr = core.method_copyReturnType(this.pointer)
    , str = core.getStringAndFree(ptr)
  return str
}

/**
 * Returns an Array of "type encodings". The array has a `length` of `2`. The
 * first element is the method return type. The second element is an Array of all
 * the method's argument types.
 *
 * @return {Array} An Array of the Method's "types".
 */

proto.getTypes = function getTypes () {
  return [ this.getReturnType(), this.getArgumentTypes() ]
}

/**
 * Exchanges the method's implementation function with another `Method` instance.
 * This is the preferred way to "swizzle" methods in Objective-C.
 *
 * @param {Method} other The other `Method` instance to swap implementations with.
 */
proto.exchangeImplementations = function exchangeImplementations (other) {
  return core.method_exchangeImplementations(this.pointer, other.pointer)
}

/**
 * Returns the function implementation of this `Method`. Also known as the `IMP`
 * of the method. The returned object is a regular JavaScript Function which may
 * be invoked directly, when given valid *"self"* and *"_sel"* arguments.
 *
 * @return {Function} The `IMP` of this `Method`.
 */

proto.getImplementation = function getImplementation () {
  return IMP.createUnwrapperFunction(core.method_getImplementation(this.pointer), this.getTypes())
}

/**
 * Returns the name of this `Method`.
 *
 * @return {String} The name of the Method.
 */

proto.getName = function getName () {
  return SEL.toString(core.method_getName(this.pointer))
}

/**
 * Returns the number of defined arguments this `Method` accepts.
 *
 * @return {Number} The number of defined arguments.
 */

proto.getNumberOfArguments = function getNumberOfArguments () {
  return core.method_getNumberOfArguments(this.pointer)
}

/**
 * Returns the overall "type encoding" of this `Method`. This is
 * a compacted/strigified version of `getTypes()`, so usually you will use that
 * over this function.
 *
 * @return {String} The "type encoding" of the Method.
 */

proto.getTypeEncoding = function getTypeEncoding () {
  return core.method_getTypeEncoding(this.pointer)
}

/**
 * Set's this `Method`'s implementation function. The `IMP` function may be
 * a regular JavaScript function or another function IMP retreived from a previous
 * call to `Method#getImplementation()`.
 *
 * @param {Function} func The new `IMP` function for this `Method`.
 * @return {Function} Returns the previous `IMP` function.
 */

proto.setImplementation = function setImplementation (func) {
  var types = this.getTypes()
    , wrapperPtr = IMP.createWrapperPointer(func, types)
    , oldFuncPointer = core.method_setImplementation(this.pointer, wrapperPtr)
  return IMP.createUnwrapperFunction(oldFuncPointer, types)
}

/*!
 * toString() override.
 */

proto.toString = function toString () {
  return '[Method: '+this.getName()+' '+this.getReturnType()+'('+this.getArgumentTypes()+') ]'
}

proto.inspect = function inspect () {
  // magenta
  return '\033[35m' + this.toString() + '\033[39m'
}
