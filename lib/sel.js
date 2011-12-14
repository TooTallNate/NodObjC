
/**
 * Provides a transparent bridge between JavaScript Strings and Objective-C
 * `SEL`s.
 */

/*!
 * Module exports.
 */

exports.toSEL = toSEL
exports.toString = toString

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC')
  , core = require('./core')
  , cache = {}

/**
 * Transforms a JS String selector into a `SEL` pointer reference.
 * This function does caching internally.
 *
 * @param {String} sel A String selector to turn into a native SEL pointer.
 * @return {Pointer} The SEL pointer that was generated, or a cached version.
 * @api private
 */

function toSEL (sel) {
  var rtn = cache[sel]
  if (rtn) return rtn
  debug('sel_registerName():', sel)
  return cache[sel] = core.sel_registerName(sel)
}

/**
 * Transforms a `SEL` reference to a JS String.
 *
 * @param {Pointer} SEL the SEL Pointer to turn into a JS String.
 * @return {String} The String value of the given SEL.
 * @api private
 */

function toString (SEL) {
  return core.sel_getName(SEL)
}
