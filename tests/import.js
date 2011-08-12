var $ = require('../')
  , assert = require('assert')

var s1 = s2 = size();
$.import('Foundation');
s2 = size();
assert.ok(s2 > s1);
s1 = s2;
$.import('ScriptingBridge');
s2 = size();
assert.ok(s2 > s1);

function size () {
  return Object.keys($).length;
}
