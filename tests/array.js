var $ = require('../')
  , Foundation = $.import('Foundation')
  , NSMutableArray = Foundation.NSMutableArray

var array = NSMutableArray.alloc().init();
array.addObject_({test:1});
console.log(array);
var array2 = NSMutableArray.arrayWithCapacity_(10);
console.log(array2);
