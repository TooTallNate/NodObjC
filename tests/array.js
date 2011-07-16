var $ = require('../')
  , Foundation = $.import('Foundation')
  , NSMutableArray = Foundation.NSMutableArray

var array = NSMutableArray({ 'arrayWithCapacity': 10 });

console.log(array('description')('UTF8String'));

console.log(array+'');
