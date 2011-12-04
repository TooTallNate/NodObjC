
/**
 * Represents a wrapped IMP. IMPs are function pointers for methods. The first
 * two arguments are always 1) the object instance the method is being called
 * on, and 2) the SEL selector, respectively. Subsequent arguments are the args
 * that were passed in when invoked.
 */

/**
 * Module exports.
 */

exports.createWrapperPointer = createWrapperPointer
exports.createUnwrapperFunction = createUnwrapperFunction

/**
 * Module dependencies.
 */

var core = require('./core')
  , types = require('./types')

/**
 * Creates an ffi Function Pointer to the passed in 'func' Function. The
 * function gets wrapped in an "wrapper" function, which wraps the passed in
 * arguments, and unwraps the return value.
 *
 * @param {Function} A JS function to be converted to an ffi C function.
 * @param {Object|Array} A "type" object or Array containing the 'retval' and
 *                       'args' for the Function.
 * @api private
 */

function createWrapperPointer (func, type) {
  if (func.pointer) {
    // When an 'unwrapper' function is passed in, return the original pointer
    return func.pointer
  }
  var rtnType = type.retval || type[0] || 'v'
    , argTypes = type.args || type[1] || []
    , ffiCb = new core.Callback([types.map(rtnType), types.mapArray(argTypes)], wrapper)
  function wrapper () {
    var args = core.wrapValues(arguments, argTypes)
      , rtn = func.apply(null, args)
    return core.unwrapValue(rtn, rtnType)
  }
  return ffiCb.getPointer()
}

/**
 * Creates a JS Function from the passed in function pointer. When the returned
 * function is invoked, the passed in arguments are unwrapped before being
 * passed to the native function, and the return value is wrapped up before
 * being returned for real.
 *
 * @param {Pointer} The function pointer to create an unwrapper function around
 * @param {Object|Array} A "type" object or Array containing the 'retval' and
 *                       'args' for the Function.
 * @api private
 */

function createUnwrapperFunction (funcPtr, type) {
  var rtnType = type.retval || type[0] || 'v'
    , argTypes = type.args || type[1] || []
    , func = core.ForeignFunction.build(funcPtr, types.map(rtnType), types.mapArray(argTypes))
  function unwrapper () {
    var args = core.unwrapValues(arguments, argTypes)
      , rtn = func.apply(null, args)
    return core.wrapValue(rtn, rtnType)
  }
  unwrapper.retval = rtnType
  unwrapper.args = argTypes
  unwrapper.pointer = funcPtr
  return unwrapper
}
