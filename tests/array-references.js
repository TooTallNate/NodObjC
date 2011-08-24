var $ = require('../')
$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init');
console.error(pool)
console.error($.NSArray)

var array = $.NSMutableArray('arrayWithCapacity', 2);
console.error(array);

array('addObject', $.NSArray);

var nsarray = array('objectAtIndex', 0);

console.log(nsarray === $.NSArray);
