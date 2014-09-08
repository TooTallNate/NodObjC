var $ = require('..');
var assert = require('assert');
$.framework('Foundation');
$.framework('Cocoa');
var pool = $.NSAutoreleasePool('alloc')('init');
var result = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionAll, $.kCGNullWindowID);
var windowList = $.CFBridgingRelease(result);

assert(windowList.getName().toString().indexOf('Array') > -1);

var error = $.alloc($.NSError).ref();
var jsonData = $.NSJSONSerialization("dataWithJSONObject", windowList, "options", $.NSJSONWritingPrettyPrinted, "error", error);
var jsonString = ($.NSString("alloc")("initWithData", jsonData, "encoding", $.NSUTF8StringEncoding)).toString();

assert(jsonString.length > 1);

pool('drain');
