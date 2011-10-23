var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')

var str = 'Hello Objective-C!'
  , nsstr = $.NSString('stringWithUTF8String', str)
assert.equal(nsstr('length'), str.length)
