/**
 * Provides a transparent bridge between JS Strings and the Obj-C SELs.
 */
var core = require('./core')
  , cache = {}

module.exports = function SEL (sel) {
  var rtn = cache[sel];
  if (rtn) return rtn;
  return cache[sel] = core.sel_registerName(sel);
}
