var types = require('../types')
  , assert = require('assert')

var type = 'v@:'
  , parsed = types.parse(type)
  , converted = types.convert(parsed)

assert.deepEqual(parsed, [ 'v', [ '@', ':' ] ])
assert.deepEqual(converted, [ 'void', [ 'pointer', 'pointer' ] ])
