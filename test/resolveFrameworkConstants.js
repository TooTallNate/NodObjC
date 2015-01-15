var $ = require('..');
var assert = require('assert');
$.framework('Foundation');
var pool = $.NSAutoreleasePool('alloc')('init');

// in NodObjC v1.0.0, NSString* constants loaded from frameworks return null
assert.equal($.NSDefaultRunLoopMode, 'kCFRunLoopDefaultMode')

pool('drain');

