var $ = require('../')
  , Foundation = $.import('Foundation')

// Create an NSAutoreleasePool
var pool = Foundation.NSAutoreleasePool('alloc')('init')

var nsstr = Foundation.NSString({ 'stringWithUTF8String': 'Hello Objective-C!' })
console.log(nsstr('UTF8String'));

nsstr = nsstr({ 'stringByAppendingString': nsstr });
console.log(nsstr('UTF8String'));
