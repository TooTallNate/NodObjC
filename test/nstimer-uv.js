var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')
var invokeCount = 0

var Obj = $.NSObject.extend('Obj')
Obj.addMethod('sel:', 'v@:@', function (self, _cmd, timer) {
  invokeCount++
  if (invokeCount == 5) {
    process.exit(0)
  }
})
Obj.register()

var timer = $.NSTimer('scheduledTimerWithTimeInterval', 1
                     ,'target', Obj('alloc')('init')
                     ,'selector', 'sel:'
                     ,'userInfo', $('Info')
                     ,'repeats', 1)

// register something persistent on libuv's event loop
var uvCount = 0
setInterval(function () {
  uvCount++
}, 100);

process.on('exit', function () {
  assert.equal(invokeCount, 5)
  assert.ok(uvCount > 50)
})

$.NSRunLoop('mainRunLoop')('run')
