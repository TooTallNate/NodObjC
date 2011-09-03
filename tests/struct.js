var struct = require('../struct')
  , assert = require('assert')
  , inspect = require('util').inspect

test('{CGPoint="x"d"y"d}', {
    name: 'CGPoint'
  , props: [
      ['x', 'd']
    , ['y', 'd']
  ]
})

test('{_NSPoint="x"f"y"f}', {
    name: '_NSPoint'
  , props: [
      ['x', 'f']
    , ['y', 'f']
  ]
})

test('{CGRect="origin"{CGPoint="x"d"y"d}"size"{CGSize="width"d"height"d}}', {
    name: 'CGRect'
  , props: [
      ['origin', '{CGPoint="x"d"y"d}']
    , ['size', '{CGSize="width"d"height"d}']
  ]
})

test('{_NSSwappedDouble="v"Q}', {
    name: '_NSSwappedDouble'
  , props: [
      ['v', 'Q']
  ]
})

test('{AEDesc="descriptorType"I"dataHandle"^^{OpaqueAEDataStorageType}}', {
    name: 'AEDesc'
  , props: [
      ['descriptorType', 'I']
    , ['dataHandle', '^^{OpaqueAEDataStorageType}']
  ]
})


function test (input, output) {
  console.log('Input:\n\t%s', input)
  var parsed = struct.parseStruct(input)
  console.log('Output:\n\t'+inspect(parsed, true, 10, true))
  console.log('\n')
  assert.deepEqual(parsed, output)
}
