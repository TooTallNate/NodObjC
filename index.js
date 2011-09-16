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
function $ (str) {
  $.import('Foundation')
  return module.exports.NSString('stringWithUTF8String', String(str))
}
