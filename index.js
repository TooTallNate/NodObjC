require('./ffi-extend')
module.exports = require('./import')

module.exports._ = function _ (str) {
  return module.exports.NSString('stringWithUTF8String', String(str))
}
