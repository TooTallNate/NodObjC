var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
$.import('ScriptingBridge')

var pool = $.NSAutoreleasePool('new')

var bi = $.NSString('stringWithUTF8String', 'com.apple.iTunes')
  , iTunes = $.SBApplication('applicationWithBundleIdentifier', bi)

assert.ok(iTunes.toString().indexOf('iTunes') !== -1);
assert.equal('iTunes', iTunes('name'));
