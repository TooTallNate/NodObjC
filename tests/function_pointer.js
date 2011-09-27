var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

assert.equal($.NSGetUncaughtExceptionHandler.args.length, 0)
assert.ok($.NSGetUncaughtExceptionHandler.rtn.function_pointer == 'true')

assert.equal($.NSSetUncaughtExceptionHandler.args.length, 1)
assert.equal($.NSSetUncaughtExceptionHandler.rtn.type, 'v')


$.NSSetUncaughtExceptionHandler(function (exception) {
  console.log(exception)
})


var handler = $.NSGetUncaughtExceptionHandler()
handler($('test'))
