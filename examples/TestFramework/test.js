var $ = require('../../')

$.import('Foundation')

console.error($.NSTestClass)

var pool = $.NSAutoreleasePool('alloc')('init')

// Absolute path
$.import(__dirname + '/Test Framework.framework')

console.error($.NSTestClass)
console.error($.NSTestClass.methods())
console.error($.NSTestClass('hello'))

var i = $.NSTestClass('alloc')('init')

console.error(i)
console.error(i.methods())
console.error(i('hello'))
