var types = require('../types')
  , assert = require('assert')

var type = 'v@:'
  , parsed = types.parse(type)
  , converted = types.mapArray(parsed)

assert.deepEqual(parsed, [ 'v', [ '@', ':' ] ])
assert.deepEqual(converted, [ 'void', [ 'pointer', 'pointer' ] ])

// test types.map()
//assert.equal(types.map('r^^{__CFData}'), 'pointer')
assert.equal(types.map('^^{__CFData}'), 'pointer')


type = 'Q40@0:8^{?=Q^@^Q[5Q]}16^@24Q32';
parsed = types.parse(type)
console.error(parsed)

type = '@68@0:8{CGRect={CGPoint=dd}{CGSize=dd}}16Q48Q56c64';
parsed = types.parse(type)
console.error(parsed)
