var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var point = $.NSMakePoint(10, 1337)
console.log('point.x: %d', point.x)
assert.equal(point.x, 10)
console.log('point.y: %d', point.y)
assert.equal(point.y, 1337)
