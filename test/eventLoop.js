// Test inspired by ./nstimer.js, but using node-friendly deconstructed event loop

var $ = require('../')
  , assert = require('assert')
  , util = require('util')
  , events = require('events')

$.import('Foundation')
$.import('Cocoa')

function EventLoop(start) {
  events.EventEmitter.call(this)

  assert.equal($.NSDefaultRunLoopMode, 'kCFRunLoopDefaultMode')

  if (start) this.start();
  return this
}
util.inherits(EventLoop, events.EventEmitter)

EventLoop.prototype.start = function() {
  this.emit('start')
  return this.schedule(true)
}
EventLoop.prototype.stop = function() {
  this._is_running = false
  this.emit('stop')
  return this
}
EventLoop.prototype._schedule = setTimeout
EventLoop.prototype.schedule = function(runRecurring) {
  if (runRecurring !== undefined)
    this._is_running = runRecurring
  var memento = this._schedule(this.eventLoop.bind(this))
  this.emit('scheduled', memento, this._is_running)
  return this
}

EventLoop.prototype.eventLoop = function(runRecurring) {
  this.eventLoopCore()
  if (this._is_running || runRecurring)
    this.schedule(runRecurring)
  return this
}
EventLoop.prototype.eventLoopCore = function(block) {
  var untilDate = block ? $.NSDate('distantFuture') : null; // or $.NSDate('distantPast') to not block
  var event, app = $.NSApplication('sharedApplication')
  var runLoopPool = $.NSAutoreleasePool('alloc')('init')

  var count = 0;
  try {
    this.emit('eventLoop-enter')
    do {
      this.emit('event-next', count)
      event = app('nextEventMatchingMask',
              $.NSAnyEventMask.toString(), // …grumble… uint64 as string …grumble…
              'untilDate', untilDate,
              'inMode', $.NSDefaultRunLoopMode,
              'dequeue', 1)
      this.emit('event-match', event, app, count)
      if (event) {
        app('sendEvent', event)
        this.emit('event-sent', event, app, count)
      }
      ++count;
    } while (event)
    this.emit('eventLoop-exit', count)
  } catch (err) {
    this.emit('error', err)
    throw err
  } finally {
    runLoopPool('drain')
  }
  return this;
}



var pool = $.NSAutoreleasePool('alloc')('init')

var Obj = $.NSObject.extend('Obj')
  , invokeCount = 0
  , eventLoopCount = 0

var evtLoop = new EventLoop()
evtLoop.on('eventLoop-exit', function(count) { eventLoopCount += count })

Obj.addMethod('sel:', 'v@:@', function (self, _cmd, timer) {
  assert.equal('Info', timer('userInfo').toString())
  if (++invokeCount == 5) {
    timer('invalidate');
    evtLoop.stop()
  }
}).register()

var timer = $.NSTimer('scheduledTimerWithTimeInterval', 0.1
                     ,'target', Obj('alloc')('init')
                     ,'selector', 'sel:'
                     ,'userInfo', $('Info')
                     ,'repeats', 1)

process.on('exit', function () {
  assert.equal(invokeCount, 5)
  assert(eventLoopCount > invokeCount, eventLoopCount+' evts > '+invokeCount+' timers')
})

evtLoop.start()
