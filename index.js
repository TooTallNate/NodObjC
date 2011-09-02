require('./ffi-extend')
module.exports = require('./import')

// TODO: Figure out something better for this bitch.
//         _() is just TOO ugly...
module.exports._ = function _ (str) {
  return module.exports.NSString('stringWithUTF8String', String(str))
}
