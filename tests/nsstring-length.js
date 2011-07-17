var $ = require('../')
  , Foundation = $.import('Foundation')

// Create an NSAutoreleasePool
var pool = Foundation.NSAutoreleasePool('alloc')('init')

var str = 'Hello Objective-C!';
var nsstr = Foundation.NSString({ 'stringWithUTF8String': str })
console.log('str.length:     %d', str.length);
console.log('[nsstr length]: %d', nsstr('length'));
