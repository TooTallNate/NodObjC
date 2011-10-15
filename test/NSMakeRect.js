var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var rect = $.NSMakeRect(1,2,3,4);
console.log('rect.origin.x: %d', rect.origin.x)
assert.equal(rect.origin.x, 1)

console.log('rect.origin.y: %d', rect.origin.y)
assert.equal(rect.origin.y, 2)

console.log('rect.size.width: %d', rect.size.width)
assert.equal(rect.size.width, 3)

console.log('rect.size.height: %d', rect.size.height)
assert.equal(rect.size.height, 4)
