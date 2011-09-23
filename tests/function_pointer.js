var $ = require('../')
  , assert = require('assert')

$.import('Foundation')

assert.deepEqual($.NSGetUncaughtExceptionHandler.args, [])
assert.deepEqual($.NSGetUncaughtExceptionHandler.rtn, {
    function_pointer: true
  , args: [ '@' ]
  , retval: 'v'
})

assert.deepEqual($.NSSetUncaughtExceptionHandler.args, [{
    function_pointer: true
  , args: [ '@' ]
  , retval: 'v'
}])
assert.equal($.NSSetUncaughtExceptionHandler.rtn, 'v')


$.NSSetUncaughtExceptionHandler(function (exception) {
  console.log(exception)
})


var handler = $.NSGetUncaughtExceptionHandler()
handler($('test'))
