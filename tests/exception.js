var $ = require('../')
$.import('Foundation')
$.NSAutoreleasePool('alloc')('init')

var array = $.NSMutableArray('alloc')('init')

try {
  array('addObject', null)
} catch (e) {
  console.error('caught exception!')
  console.error(e.stack)
}
