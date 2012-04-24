
exports = module.exports = getGlobal
exports.setGlobal = setGlobal

var g = require('./index')

function getGlobal () {
  return g
}

function setGlobal (_g) {
  g = _g
}
