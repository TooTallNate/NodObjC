// // This example adapted from Matt Gallagher's "Minimalist Cocoa Programming"
// // blog article:
// //    http://cocoawithlove.com/2010/09/minimalist-cocoa-programming.html
// var $ = require('../../../../')
// var EventLoop = require('../../../EventLoop')
// EventLoop.initObjC($)
//
// $.import('Cocoa')
//
// var pool = $.NSAutoreleasePool('alloc')('init')
//   , app  = $.NSApplication('sharedApplication')
//   , evtLoop = new EventLoop()
//
// app('setActivationPolicy', $.NSApplicationActivationPolicyRegular)
//
// var menuBar = $.NSMenu('alloc')('init')
//   , appMenuItem = $.NSMenuItem('alloc')('init')
//
// menuBar('addItem', appMenuItem)
// app('setMainMenu', menuBar)
//
// var appMenu = $.NSMenu('alloc')('init')
//   , appName = $('Hello NodeJS!')
//   , quitTitle = $('Quit "' + appName + '"')
//   , quitMenuItem = $.NSMenuItem('alloc')('initWithTitle', quitTitle
//                                         ,'action', 'terminate:'
//                                         ,'keyEquivalent', $('q'))
// appMenu('addItem', quitMenuItem)
// appMenuItem('setSubmenu', appMenu)
//
// var styleMask = $.NSTitledWindowMask
//               | $.NSResizableWindowMask
//               | $.NSClosableWindowMask
// var window = $.NSWindow('alloc')('initWithContentRect', $.NSMakeRect(0,0,200,200)
//                                 ,'styleMask', styleMask
//                                 ,'backing', $.NSBackingStoreBuffered
//                                 ,'defer', false)
// window('setAlphaValue', 0)
// window('cascadeTopLeftFromPoint', $.NSMakePoint(20,20))
// window('setTitle', appName)
// window('makeKeyAndOrderFront', window)
// window('center')
// window('setBackgroundColor', $.NSColor('greenColor'))
// window('animator')('setAlphaValue',1)
//
//
//
//
// var textV = $.NSTextView('alloc')('initWithFrame', $.NSMakeRect(0,100,100,100));
//  textV('setAutoresizingMask', $.NSViewWidthSizable | $.NSViewMinYMargin)
// window('contentView')('addSubview', textV)
//
// // AppDelegate.addMethod('textDidChange:', 'v@:@', function (self, _cmd, notif) {
// 	// $.playTrumpet()
// // })
//
//
// // set up the app delegate
// var AppDelegate = $.NSObject.extend('AppDelegate')
// AppDelegate.addMethod('applicationDidFinishLaunching:', 'v@:@', function (self, _cmd, notif) {
//   console.log('got applicationDidFinishLauching')
//   console.log(notif)
// })
// AppDelegate.addMethod('applicationWillTerminate:', 'v@:@', function (self, _cmd, notif) {
//   console.log('got applicationWillTerminate')
//   console.log(notif)
// })
// AppDelegate.register()
//
// var delegate = AppDelegate('alloc')('init')
// app('setDelegate', delegate)
//
// app('activateIgnoringOtherApps', true)
// app('finishLaunching')
//
// evtLoop.start()



// This example adapted from Matt Gallagher's "Minimalist Cocoa Programming"
// blog article:
//    http://cocoawithlove.com/2010/09/minimalist-cocoa-programming.html
var $ = require('../../../../')

$.framework('Cocoa')
// $.framework('AtoZ')
// $.import('AppKit')
// $.import('AtoZ')

var pool = $.NSAutoreleasePool('alloc')('init'),
		app  = $.NSApplication('sharedApplication')
    // atoz = $.AtoZ
		
// var z = atoz.methods()
// $.NSLog(atoz('class')('globalPalette')('stringValue'))

app('setActivationPolicy', $.NSApplicationActivationPolicyRegular)

var menuBar     =     $.NSMenu('new'),
		appMenuItem = $.NSMenuItem('new')

menuBar('addItem', appMenuItem)
app('setMainMenu', menuBar)

var      appMenu = $.NSMenu('new'),
         appName = $('Hello NodeJS!'),
       quitTitle = $('Quit "' + appName + '"'),
    quitMenuItem = $.NSMenuItem('alloc')('initWithTitle', quitTitle, 'action', 'terminate:', 'keyEquivalent', $('q')),
		 AppDelegate = $.NSObject.extend('AppDelegate') // set up the app delegate

    appMenu('addItem', quitMenuItem)
appMenuItem('setSubmenu',   appMenu)

var styleMask = $.NSTitledWindowMask | $.NSResizableWindowMask | $.NSClosableWindowMask
var window 		= $.NSWindow('alloc')('initWithContentRect', $.NSMakeRect(0,0,200,200),
                                              'styleMask', styleMask,
                                                'backing', $.NSBackingStoreBuffered,
                                                  'defer', false)
window('setAlphaValue', 0)
window('cascadeTopLeftFromPoint', $.NSMakePoint(20,20))
window('setTitle', appName)
window('makeKeyAndOrderFront', window)
window('center')
window('setBackgroundColor', $.NSColor('greenColor'))
window('animator')('setAlphaValue',1)

var textV = $.NSTextView('alloc')('initWithFrame', $.NSMakeRect(0,100,100,100));
 textV('setAutoresizingMask', $.NSViewWidthSizable | $.NSViewMinYMargin)
window('contentView')('addSubview', textV)

AppDelegate.addMethod('textDidChange:', 'v@:@', function (self, _cmd, notif) {
	$.playTrumpet()
})


AppDelegate.addMethod('applicationDidFinishLaunching:', 'v@:@', function (self, _cmd, notif) {
  // console.log('got applicationDidFinishLauching')
  // console.log(notif)
})
AppDelegate.addMethod('applicationWillTerminate:', 'v@:@', function (self, _cmd, notif) {
  console.log('got applicationWillTerminate')
  console.log(notif)
})
AppDelegate.addMethod('windowDidMove:', 'v@:@', function (self, _cmd, notif) {
	var x = window('backgroundColor')
	window('setBackgroundColor', x == $.NSColor('purpleColor') ? $.NSColor('redColor') : $.NSColor('blueColor'))
})
AppDelegate.addMethod('windowDidResize:', 'v@:@', function (self, _cmd, notif) {
	if ((notif('object')('width') % 100) < 10) {
    window('animator')('setBackgroundColor', $.AtoZ('globalPalette')('nextNormalObject'))
		// $.AZTalker('randomDicksonism')
		// ($.NSString('randomDicksonism'))
	}
})


AppDelegate.register()

var delegate = AppDelegate('new')

textV('setDelegate',delegate)
app('setDelegate', delegate)
window('setDelegate', delegate)
app('activateIgnoringOtherApps', true)
//  var azb = $.getenv('AZBUILD')
// $.NSLog('%@','vageem')
// console.error('vageem')
// var array = $.NSMutableArray('alloc')('init')
// array('addObject', $('Hello World!'))
// console.log(array)

// var jsString = 'a javascript String'
// var nsString = $(jsString)
// $.NSLog(nsString)

// window('setBackgroundColor', $.NSColor('purpleColor')
app('run')
