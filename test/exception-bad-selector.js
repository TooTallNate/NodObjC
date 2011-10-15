var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

assert.throws(function () {
  $.NSObject('nonexistantMethod')
})

try {
  $.NSObject('nonexistantMethod')
} catch (e) {
  assert.equal('NSInvalidArgumentException', e('name'))
}
