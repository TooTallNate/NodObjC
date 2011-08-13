/**
 * Provides a transparent bridge between JS Strings and the Obj-C SELs.
 */
var core = require('./core')
  , cache = {}

/**
 * Transforms a JS String selector into a SEL pointer reference.
 * This function does caching internally.
 */
exports.toSEL = function toSEL (sel) {
  var rtn = cache[sel];
  if (rtn) return rtn;
  return cache[sel] = core.sel_registerName(sel);
}

/**
 * Transforms a SEL reference to a JS String.
 */
exports.toString = function toString (SEL) {
  return core.sel_getName(SEL);
}
