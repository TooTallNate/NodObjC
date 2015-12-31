var $ = require('../');
var assert = require('assert');

$.import('Foundation');

var pool = $.NSAutoreleasePool('alloc')('init');
var counter = 0;
var orig;

function description (self, _cmd) {
  counter++;
  assert.equal(_cmd, 'description');
  var s = self.super('description');
  return s;
}

// extend NSObject into a new class: NRObject
$.NSObject
  .extend('NRObject')
  .addMethod('description', { retval: '@', args: [ '@', ':' ] }, description)
  .register();

var instance = $.NRObject('alloc')('init');

assert.equal(counter, 0);
var desc = instance('description');
assert.equal(counter, 1);
