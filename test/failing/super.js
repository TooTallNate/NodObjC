
var assert = require('assert')

require('../../').global()

importFramework('Foundation')

var pool = NSAutoreleasePool('alloc')('init')
  , counter = 0
  , orig

function description (self, _cmd) {
  counter++
  assert.equal(_cmd, 'description')
  //console.error('before')
  var s = self.super('description')
  console.error(s('UTF8String'))
  console.error(s.getClass()('class'))
  //console.error(orig('length'))
  //console.error(orig('class'))
  //console.error('after')
  //console.error('[super description] ==', orig)
  //return orig('uppercaseString')
  return s
  //return NSString('stringWithUTF8String', 'test')
}

// extend NSObject into a new class: NRObject
NSObject
  .extend('NRObject')
  .addMethod('description', { retval: '@', args: [ '@', ':' ] }, description)
  .register()

var instance = NRObject('alloc')('init')

assert.equal(counter, 0)
var desc = instance('description')
console.error('outside')
console.error(desc('length'))
//console.error(desc('class').pointer)
assert.equal(counter, 1)

console.error('[instance description] ==', desc)
