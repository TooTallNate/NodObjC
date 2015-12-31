var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init');

var array = $.NSMutableArray('arrayWithCapacity', 2);
assert.equal(array('count'), 0);

array('addObject', $.NSArray);
assert.equal(array('count'), 1);

var o = $.NSObject('alloc')('init');
array('addObject', o);
assert.equal(array('count'), 2);

var nsarray = array('objectAtIndex', 0);
assert.equal(nsarray.pointer.address(), $.NSArray.pointer.address())
assert.ok(nsarray === $.NSArray, 'fails strict equality test')

var o2 = array('objectAtIndex', 1);
assert.equal(o2.pointer.address(), o.pointer.address())
assert.ok(o === o2, 'fails strict equality test')
