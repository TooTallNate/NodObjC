var $ = require('../')
  , assert = require('assert')

$.import('Foundation');

assert.ok($.NSObject.listMethods().length > 0);
