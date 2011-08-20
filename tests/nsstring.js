var $ = require('../')
$.import('Foundation')

// Create an NSAutoreleasePool
var pool = $.NSAutoreleasePool('alloc')('init')

var nsstr = $.NSString({ 'stringWithUTF8String': 'Hello Objective-C!' })
console.log(nsstr('UTF8String'));

nsstr = nsstr({ 'stringByAppendingString': nsstr });
console.log(nsstr('UTF8String'));
