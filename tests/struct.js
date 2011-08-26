var struct = require('../struct')
  , assert = require('assert')
  , inspect = require('util').inspect

test('{CGPoint="x"d"y"d}')
test('{CGRect="origin"{CGPoint="x"d"y"d}"size"{CGSize="width"d"height"d}}')
test('{_NSSwappedDouble="v"Q}')
test('{AEDesc="descriptorType"I"dataHandle"^^{OpaqueAEDataStorageType}}')

function test (input, output) {
  console.log('Input:\n\t%s', input)
  var parsed = struct.parseStruct(input)
  console.log('Output:\n\t'+inspect(parsed, true, 10));
  console.log('\n')
}
