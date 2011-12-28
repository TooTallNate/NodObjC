
/**
 * Represents a wrapped `IMP` (a.k.a. method implementation). `IMP`s are function pointers for methods. The first two arguments are always:
 *
 *   1. `self` - The object instance the method is being called on.
 *   2. `_cmd` - The `SEL` selector of the method being invoked.
 *
 * Any additional arguments that get passed are the actual arguments that get
 * passed along to the method.
 */

/*!
 * Module exports.
 */

exports.createWrapperPointer = createWrapperPointer
exports.createUnwrapperFunction = createUnwrapperFunction

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC')
  , core = require('./core')
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
    debug('Detected an \'unwrapper\' function, returning original pointer')
    return func.pointer
  }
  var rtnType = type.retval || type[0] || 'v'
    , argTypes = type.args || type[1] || []
    , ffiDef = [types.map(rtnType), types.mapArray(argTypes)]
    , ffiCb = new core.Callback(ffiDef, wrapper)
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
    , func = core.ForeignFunction.build(funcPtr
                                      , types.map(rtnType)
                                      , types.mapArray(argTypes))
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
