const $ = require('../');
const assert = require('assert');

$.import('Foundation');

// Class
var m = $.NSObject.methods();
assert.ok(includes(m, 'alloc'));
assert.ok(includes(m, 'new'));

// instance
var i = $.NSObject('alloc')('init');
m = i.methods();
assert.ok(!includes(m, 'alloc'));
assert.ok(!includes(m, 'new'));
assert.ok(includes(m, 'init'));
assert.ok(includes(m, 'dealloc'));
m.forEach(function (name) {
  assert.ok($.NSObject('instancesRespondToSelector', name));
});


function includes (array, val) {
  return array.indexOf(val) !== -1;
}
