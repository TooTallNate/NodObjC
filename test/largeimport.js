var $ = require('../');
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
var hrstart = process.hrtime();
$.import('Foundation')
$.import('Cocoa')
$.import('WebKit')
$.import('AppKit')
$.import('CoreGraphics')
$.import('CoreFoundation')
$.import('DebugSymbols')
$.import('ScriptingBridge')
$.import('AVKit')
$.import('Accelerate')
$.import('AddressBook')
$.import('ApplicationServices')
$.import('Automator')
$.import('CFNetwork')
$.import('CalendarStore')
$.import('CoreAudio')
$.import('CoreAudioKit')
$.import('CoreData')
$.import('CoreMedia')
var hrend = process.hrtime(hrstart);
var diff = hd.end();

process.stdout.write("\033[90m memory ["+diff.change.size_bytes+' bytes]');
process.stdout.write(" time ["+hrend[0]+"s "+(hrend[1]/1000000)+" ms] \033[0m");
