var $ = require('../');
var assert = require('assert');

$.framework('Foundation');
$.framework('Cocoa');

var pool = $.NSAutoreleasePool('alloc')('init');
var result = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionAll, $.kCGNullWindowID);
var windowList = $.CFBridgingRelease(result);

assert(windowList('class').getName().indexOf('Array') > -1);

var error = $.alloc($.NSError).ref();
var jsonData = $.NSJSONSerialization('dataWithJSONObject', windowList, 'options', $.NSJSONWritingPrettyPrinted, 'error', error);
var jsonString = $.NSString('alloc')('initWithData', jsonData, 'encoding', $.NSUTF8StringEncoding);

var parsed = JSON.parse(jsonString);
assert.ok(Array.isArray(parsed));
assert.ok(parsed.length > 0);

pool('drain');
