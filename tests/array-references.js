var $ = require('../')
  , F = $.import('Foundation')

var pool = F.NSAutoreleasePool('alloc')('init');

var array = F.NSMutableArray({ 'arrayWithCapacity': 2 });

array({ 'addObject': F.NSArray });

var nsarray = array({ 'objectAtIndex': 0 });

console.log(nsarray === F.NSArray);
