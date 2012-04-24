var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')

// Subclass 'NSObject', creating a new class named 'NRTest'
var NRTest = $.NSObject.extend('NRTest')
  , counter = 0

// Add a new method to the NRTest class responding to the "description" selector
NRTest.addMethod('description', '@@:', function (self, _cmd) {
  counter++
  assert.equal(_cmd, 'description')
  return $('test')
})

// Add an instance variable, an NSString* instance.
assert.ok(NRTest.addIvar('name', '@'))

// Test that the Class does not exist on $ before register() is called
assert.ok(!$.NRTest)
assert.notEqual(NRTest, $.NRTest)

// Finalize the class so the we can make instances of it
NRTest.register()

// Test that the Class gets set onto $ after register() is called
assert.strictEqual(NRTest, $.NRTest)

// Create an instance
var instance = NRTest('alloc')('init')

// call [instance description] in a variety of ways (via toString())
var str = 'test'
assert.equal(str, instance('description')+'')
assert.equal(str, instance.toString())
assert.equal(str, ''+instance)
assert.equal(str, instance+'')

assert.equal(counter, 4)
