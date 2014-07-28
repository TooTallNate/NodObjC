$ = require('../../nodobjc');
$.import('Foundation',0);
$.import('Cocoa',0);

var pool = $.NSAutoreleasePool('alloc')('init');

var memwatch = require('memwatch');
memwatch.on('leak', function(e) {
	console.log('suspected leak: ', e);
});
memwatch.on('stats', function(e) {
	console.log('memory stats: ', e);
});

var text = $.NSTextField('alloc')('initWithFrame', $.NSMakeRect(0,0,200,20) );
var hd = new memwatch.HeapDiff();

for(var i=0; i < 10000; i++) {
	var p = $.NSMakeRect(0,0,100,100);
	text('setFrame',p);
	var z = text('frame');
}
pool('release');
var diff = hd.end();
console.assert(diff.change.size_bytes <= 0, 'It seems were leaking memory.',diff);
process.exit();