var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init');
console.error(pool)
console.error($.NSArray)

var array = $.NSMutableArray('arrayWithCapacity', 2);
console.error(array);

array('addObject', $.NSArray);
console.error(array);

var nsarray = array('objectAtIndex', 0);

assert.equal(nsarray.pointer.address, $.NSArray.pointer.address)
assert.ok(nsarray === $.NSArray, 'fails strict equality test')
