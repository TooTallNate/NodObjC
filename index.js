// Load the node-ffi extensions
require('./ffi-extend')

// The main exports is the casting function
module.exports = $
$._ = $ // legacy. TODO: remove by 0.1.0

// export the exports from the 'import' module
var Import = require('./import')
$.import  = Import.import
$.resolve = Import.resolve

// This function accepts native JS types (String, Number, Date) and converts them
// to the proper Objective-C type (NSString, NSNumber, NSDate).
//   Syntax Sugar...
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


function isDate (d) {
  return d instanceof Date
      || Object.prototype.toString.call(d) == '[object Date]'
}
