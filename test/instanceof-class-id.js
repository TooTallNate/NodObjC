var $ = require('../');
var ID = require('../lib/id');
var Class = require('../lib/class');
var Exception = require('../lib/exception');
var assert = require('assert');

$.framework('Foundation');

// Obj-C Classes should be instances of Class and ID
assert.equal('function', typeof $.NSObject);
assert($.NSObject instanceof Function);
assert($.NSObject instanceof Class);
assert($.NSObject instanceof ID);
assert(!($.NSObject instanceof Exception));


// Obj-C Instances should be instances of ID only
var o = $.NSObject('alloc')('init');
assert.equal('function', typeof o);
assert(o instanceof Function);
assert(!(o instanceof Class));
assert(o instanceof ID);
assert(!(o instanceof Exception));


// Obj-C Exceptions should be instances of ID and Exception, not Class
var e;
var array = $.NSMutableArray('alloc')('init');

try {
  array('addObject', null);
} catch (_e) {
  e = _e;
}

assert.equal('function', typeof e);
assert(e instanceof Function);
assert(!(e instanceof Class));
assert(e instanceof ID);
assert(e instanceof Exception);
