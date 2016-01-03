var $ = require('../');
var assert = require('assert');

$.import('Foundation');
var pool = $.NSAutoreleasePool('alloc')('init');

var e1, e2;
var array = $.NSMutableArray('alloc')('init');

try {
  array('addObject', null);
} catch (_e) {
  e1 = _e;
}

assert.equal('function', typeof e1);
assert.equal('NSInvalidArgumentException', e1('name'));
assert.equal('NSInvalidArgumentException', e1.name);
assert.equal('function', typeof e1.msgSend);
assert.equal('function', typeof e1.getClassName);
assert.equal('NSException', e1.getClassName());
assert.equal(e1.name + ': ' + e1.message, e1.toString());
assert.ok(e1.stack.length > 0);
assert.ok(e1.message.length > 0);
assert.ok(e1 instanceof e1.constructor);
assert.equal(e1.getClass(), $.NSException);

assert.throws(function () {
  e1('raise');
});



try {
  array('objectAtIndex', 100);
} catch (_e) {
  e2 = _e;
}

assert.equal('function', typeof e2);
assert.equal('NSRangeException', e2('name'));
assert.equal('NSRangeException', e2.name);
assert.equal('function', typeof e2.msgSend);
assert.equal('function', typeof e2.getClassName);
assert.equal('NSException', e2.getClassName());
assert.ok(e2.stack.length > 0);
assert.ok(e2.message.length > 0);
assert.ok(e2 instanceof e2.constructor);
assert.equal(e2.getClass(), $.NSException);

assert.throws(function () {
  e2('raise');
});


// at this point, `e1.name` should still be intact
// (see https://github.com/TooTallNate/node-function-name/issues/3)
assert.equal('NSInvalidArgumentException', e1.name,
    'most recent exception name is being cached!');
assert.equal('NSRangeException', e2.name,
    'most recent exception name is being cached!');

pool('release');
