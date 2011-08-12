var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init');
  , array = $.NSMutableArray({ 'arrayWithCapacity': 10 });

console.log(array);
