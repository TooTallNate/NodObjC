var $ = require('../')
  , assert = require('assert')
  , str = 'Hello Objective-C!'

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')
  , nsstr = $.NSString('stringWithUTF8String', 'Hello Objective-C!')

assert.equal(str, nsstr.toString())

nsstr = nsstr('stringByAppendingString', nsstr)
assert.equal(str+str, nsstr.toString())
