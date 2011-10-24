var $ = require('../')
  , assert = require('assert')

$.import('Foundation')
var pool = $.NSAutoreleasePool('alloc')('init')

var errRef = $.NSError.createPointer().ref()
  , str = $.NSString(
            'stringWithContentsOfFile', $('DOES_NOT_EXIST'),
            'encoding', $.NSUTF8StringEncoding,
            'error', errRef
          )

// Result of NSString method call should be `nil`
assert.ok(str === null)

var err = errRef.deref()
  , domain = err('domain')
  , userInfo = err('userInfo')
assert.equal('NSCocoaErrorDomain', domain)
assert.ok(userInfo('isKindOfClass', $.NSDictionary))
assert.equal(userInfo('objectForKey', $('NSFilePath')), 'DOES_NOT_EXIST')
