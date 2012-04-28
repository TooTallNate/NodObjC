var $ = require('../../')
$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

// Create an NSArray with some random entries
var array = $.NSMutableArray('alloc')('init')
for (var i = 0; i<10; i++) {
  var str = $(String.fromCharCode(Math.round(Math.random()*26)+('a'.charCodeAt(0))))
  array('addObject', str)
}

console.error(array)

// Enumerate using a Block
array('enumerateObjectsUsingBlock', function (obj, index, stopPtr) {
  console.error('%d: %s', index, obj)
})
