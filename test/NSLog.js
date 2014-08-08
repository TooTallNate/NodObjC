var $ = require('../');
var fs = require('fs');
var assert = require('assert');
var logfile = __filename + '.log';
var test = 'test';

$.import('Foundation');
var pool = $.NSAutoreleasePool('alloc')('init');

fs.closeSync(2);
var fd = fs.openSync(logfile, 'w');

// The result of NSLog() will be written to `logfile`
$.NSLog($(test));

fs.closeSync(fd);
var log = fs.readFileSync(logfile, 'utf8');
fs.unlinkSync(logfile);

assert.equal(test + '\n', log.substring(log.length - test.length - 1));


// $.NSLog($("An object: %@"), $.NSArray('alloc')('init'))
// Need a "function generator" to variadic functions before this will work.
