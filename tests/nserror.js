var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')

var errRef = $.NSError.createPointer().ref()
  , str = $.NSString(
            'stringWithContentsOfFile', $._('DOES_NOT_EXIST'),
            'encoding', $.NSUTF8StringEncoding,
            'error', errRef
          )

assert.ok(str === null)

var err = errRef.deref()
  , domain = err('domain')
  , userInfo = err('userInfo')
console.error(err)
console.error(domain)
console.error(userInfo)
