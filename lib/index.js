
/**
 * NodObjC is the bridge between NodeJS and the Objective-C runtime and
 * frameworks.
 */

/*!
 * Module exports.
 */

module.exports = $

/*!
 * Load the node-ffi extensions.
 */

require('./ffi-extend')

/*!
 * Module dependencies.
 */

var Import = require('./import')

/*!
 * Set the initial exports onto the $ function.
 */

$.import  = Import.import
$.resolve = Import.resolve

/**
 * This function accepts native JS types (String, Number, Date) and converts them
 * to the proper Objective-C type (NSString, NSNumber, NSDate).
 *
 * Often times, you will use this function to cast a JS String into an NSString
 * for methods that accept NSStrings (since NodObjC doesn't automatically cast to
 * NSStrings in those instances).
 *
 *     var jsString = 'a javascript String'
 *     var nsString = $(jsString)
 *
 *     $.NSLog(nsString)
 *
 * @param {String|Number|Date} o the JS object to convert to a Cocoa equivalent type.
 * @return {id} The equivalent Cocoa type as the input object. Could be an `NSString`, `NSNumber` or `NSDate`.
 */

function $ (o) {
  var t = typeof o
  if (t == 'string') {
    return $.NSString('stringWithUTF8String', String(o))
  } else if (t == 'number') {
    return $.NSNumber('numberWithDouble', Number(o))
  } else if (isDate(o)) {
    return $.NSDate('dateWithTimeIntervalSince1970', o / 1000)
  }
  throw new Error('Unsupported object passed in to convert: ' + o)
}

/*!
 * Returns true if `d` is a `Date` instance.
 */

function isDate (d) {
  return d instanceof Date
      || Object.prototype.toString.call(d) == '[object Date]'
}
