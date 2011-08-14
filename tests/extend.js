var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

// Subclass 'NSObject', creating a new class named 'NRTest'
var NRTest = $.NSObject.extend('NRTest')

// Add a new method to the NRTest class responding to the "description" selector
NRTest.addMethod('description', '@@:', function () {
  return $.NSString('stringWithUTF8String', 'test')
})

// Finalize the class so the we can make instances of it
NRTest.register()

// Create an instance
var instance = NRTest('alloc')('init')

// call [instance description]
console.log(instance('description')+'')
console.log(instance.toString())
console.log(instance.toString+'')
console.log(instance+'') // This segfaults, WTF?
