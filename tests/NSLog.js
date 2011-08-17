var $ = require('../')
$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

$.NSLog($._('test'))
// $.NSLog($._("An object: %@"), $.NSArray('alloc')('init'))
// Need a "function generator" to variadic functions before this will work.
