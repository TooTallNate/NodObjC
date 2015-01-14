// This example adapted from Matt Gallagher's "Minimalist Cocoa Programming"
// blog article:
//    http://cocoawithlove.com/2010/09/minimalist-cocoa-programming.html
var $ = require('../../../../')
var EventLoop = require('../../../EventLoop')
EventLoop.initObjC($)

$.import('Cocoa')

var pool = $.NSAutoreleasePool('alloc')('init')
  , app  = $.NSApplication('sharedApplication')
  , evtLoop = new EventLoop()

app('setActivationPolicy', $.NSApplicationActivationPolicyRegular)

var menuBar = $.NSMenu('alloc')('init')
  , appMenuItem = $.NSMenuItem('alloc')('init')

menuBar('addItem', appMenuItem)
app('setMainMenu', menuBar)

var appMenu = $.NSMenu('alloc')('init')
  , appName = $('Hello NodeJS!')
  , quitTitle = $('Quit "' + appName + '"')
  , quitMenuItem = $.NSMenuItem('alloc')('initWithTitle', quitTitle
                                        ,'action', 'terminate:'
                                        ,'keyEquivalent', $('q'))
appMenu('addItem', quitMenuItem)
appMenuItem('setSubmenu', appMenu)

var styleMask = $.NSTitledWindowMask
              | $.NSResizableWindowMask
              | $.NSClosableWindowMask
var window = $.NSWindow('alloc')('initWithContentRect', $.NSMakeRect(0,0,200,200)
                                ,'styleMask', styleMask
                                ,'backing', $.NSBackingStoreBuffered
                                ,'defer', false)
window('cascadeTopLeftFromPoint', $.NSMakePoint(20,20))
window('setTitle', appName)
window('makeKeyAndOrderFront', window)
window('center')

// set up the app delegate
var AppDelegate = $.NSObject.extend('AppDelegate')
AppDelegate.addMethod('applicationDidFinishLaunching:', 'v@:@', function (self, _cmd, notif) {
  console.log('got applicationDidFinishLauching')
  console.log(notif)
})
AppDelegate.addMethod('applicationWillTerminate:', 'v@:@', function (self, _cmd, notif) {
  console.log('got applicationWillTerminate')
  console.log(notif)
})
AppDelegate.register()

var delegate = AppDelegate('alloc')('init')
app('setDelegate', delegate)

app('activateIgnoringOtherApps', true)
app('finishLaunching')

evtLoop.start()
