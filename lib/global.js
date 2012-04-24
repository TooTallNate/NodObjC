
/**
 * This tiny "global" module keeps track of whether NodObjC is in "module" mode or
 * "global" mode. NodObjC starts off in "module" mode. That is, symbols that gets
 * imported are attached to the module variable, rather than the global scope.
 *
 * To make NodObjC enter "global" mode, invoke the `global()` function when
 * requiring NodObjC:
 *
 * ``` js
 * require('NodObjC').global()
 * ```
 */

exports = module.exports = getGlobal
exports.setGlobal = setGlobal

var g = require('./index')

function getGlobal () {
  return g
}

function setGlobal (_g) {
  g = _g
}
