var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

assert.equal($.NSGetUncaughtExceptionHandler.args.length, 0)
assert.ok($.NSGetUncaughtExceptionHandler.retval.function_pointer == 'true')

assert.equal($.NSSetUncaughtExceptionHandler.args.length, 1)
assert.equal($.NSSetUncaughtExceptionHandler.retval.type, 'v')


$.NSSetUncaughtExceptionHandler(function (exception) {
  console.log(exception)
})


var handler = $.NSGetUncaughtExceptionHandler()
handler($('test'))
