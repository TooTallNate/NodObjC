var $ = require('../')
  , fs = require('fs')
  , assert = require('assert')

$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

// suppress the "unrecognized selector sent to class" messages on stderr
fs.closeSync(2)

assert.throws(function () {
  $.NSObject('nonexistantMethod')
})

var e;
try {
  $.NSObject('nonexistantMethod')
} catch (_e) {
  e = _e;
}

assert.equal('NSInvalidArgumentException', e('name'))
