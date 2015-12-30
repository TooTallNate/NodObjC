var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var a = $.NSMutableArray.ancestors();
assert.equal('NSMutableArray', a[0]);
assert.equal('NSArray', a[1]);
assert.equal('NSObject', a[2]);

var instance = $.NSMutableArray('alloc')('init');
a = instance.ancestors();
// a[0] is implementation-defined ("__NSArrayM" in my case)
// so we shouldn't test for that
assert.equal('NSMutableArray', a[1]);
assert.equal('NSArray', a[2]);
assert.equal('NSObject', a[3]);
