var $ = require('../')
$.import('Foundation')

var pool = $.NSAutoreleasePool('alloc')('init')

var command = $('tell (system info) to return system version')
var appleScript = $.NSAppleScript('alloc')('initWithSource', command)

var resultObj = appleScript('executeAndReturnError', null)
if (resultObj) {
  console.dir(resultObj('stringValue').toString())
}
