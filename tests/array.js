var $ = require('../')
  , F = $.import('Foundation')

var pool = F.NSAutoreleasePool('alloc')('init');

var array = F.NSMutableArray({ 'arrayWithCapacity': 10 });

console.log(array+'');
