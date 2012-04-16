
/**
 * This module keeps libuv's event loop running while Objective-C's NSRunLoop
 * on the main thread takes over. i.e. when `$.NSRunLoop('mainRunLoop')('run')`,
 * `$.NSApp('run')`, or `$.NSApplicationMain()`, etc. get invoked.
 *
 * This happens by registering an NSTimer subclass instance that will invoke
 * `uv_run_once(uv_default_loop())` in it's callback. The instance gets
 * registered on the main loop and runs every 0.02 seconds.
 */

module.exports = setup

var core = require('./core')

function setup ($) {
  var uv_default_loop = core.process.get('uv_default_loop')
    , uv_run_once = core.process.get('uv_run_once')
    , pool = $.NSAutoreleasePool('new')

  // JavaScript-ize!!!
  uv_default_loop = new core.ForeignFunction(uv_default_loop, 'pointer', [])
  uv_run_once = new core.ForeignFunction(uv_run_once, 'void', ['pointer'])

  // get a reference to node's libuv event loop
  var defaultLoop = uv_default_loop()

  // the LibuvDriver class runs the libuv event loop
  var LibuvDriver = $.NSObject.extend('LibuvDriver')
  LibuvDriver.addMethod('tick:', 'v@:@', function (/*self, _cmd, timer*/) {
    uv_run_once(defaultLoop)
  })
  LibuvDriver.register()

  // create a LibuvDriver instance add add it to the main NSRunLoop loop
  var interval = 0.02
  $.NSTimer('scheduledTimerWithTimeInterval', interval
               ,'target', LibuvDriver('alloc')('init')
               ,'selector', 'tick:'
               ,'userInfo', null
               ,'repeats', 1)

  pool('release')
  pool = null
}
