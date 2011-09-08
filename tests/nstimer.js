var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')

var Obj = $.NSObject.extend('Obj')
Obj.addMethod('sel:', 'v@:@', function (self, _cmd, timer) {
  console.log('self:\t%s', self)
  console.log('timer:\t%s', timer)
  console.log('info:\t%s', timer('userInfo'))
  console.log()
}).register()

var timer = $.NSTimer('scheduledTimerWithTimeInterval', 2.0
                     ,'target', Obj('alloc')('init')
                     ,'selector', 'sel:'
                     ,'userInfo', $._('Info')
                     ,'repeats', 1)

$.NSRunLoop('mainRunLoop')('run')
