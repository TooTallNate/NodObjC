var $ = require('../');

// import the "Foundation" framework and its dependencies
$.import('Foundation');

// create the mandatory NSAutoreleasePool instance
var pool = $.NSAutoreleasePool('alloc')('init');

// create an NSString of the applescript command that will be run
var command = $('tell (system info) to return system version');

// create an NSAppleScript instance with the `command` NSString
var appleScript = $.NSAppleScript('alloc')('initWithSource', command);

// finally execute the NSAppleScript instance synchronously
var resultObj = appleScript('executeAndReturnError', null);

// resultObj may be `null` or an NSAppleEventDescriptor instance, so check first
if (resultObj) {
  // print out the value
  console.dir(resultObj('stringValue').toString());
}
