
/**
 * Test that the JS RegExp -> NSRegularExpression casting works.
 */

var $ = require('../');
var assert = require('assert');

$.framework('Foundation');

var regexp = /^foo(.*)$/gi;
var nsregularexpression = $(regexp);

assert(/regularexpression/i.test(nsregularexpression.getClassName()));

//var match = nsregularexpression();
console.log(nsregularexpression);
