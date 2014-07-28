$ = require('../../nodobjc');
$.import('Foundation',0);
$.import('Cocoa',0);

//var pool = $.NSAutoreleasePool('alloc')('init');

var memwatch = require('memwatch');
memwatch.on('leak', function(e) {
	console.log('suspected leak: ', e);
});
memwatch.on('stats', function(e) {
	console.log('memory stats: ', e);
});
var failures = 0;
var failuresSize = 0;

for (var j=0; j < 10; j++) {
	var text = $.NSTextField('alloc')('initWithFrame', $.NSMakeRect(0,0,200,20) );
	var hd = new memwatch.HeapDiff();
	for(var i=10; i < 9000; i++) {
		//var p = $.NSMakeRect(0,0,100,i);
		
		var z = text('frame');
		z.size.height = i;
		text('setFrame',z);
		var p = text('frame');
		console.assert(z.size.width == p.size.width, 'width was invalid: ',z.size.width,p.size.width);
		console.assert(z.size.height == p.size.height, 'height was invalid: ',z.size.height,p.size.height);
		console.assert(z.origin.x == p.origin.x, 'x was invalid: ',z.origin.x,p.origin.x);
		console.assert(z.origin.y == p.origin.y, 'y was invalid: ',z.origin.y,p.origin.y);
	}
	gc();
	var diff = hd.end();
	if(diff.change.size_bytes > 0) {
		failures++;
		failuresSize += diff.change.size_bytes;
	}
	console.log('test '+j+' of 10 completed, change in bytes was: '+diff.change.size_bytes);
}
console.log('Failures: '+failures+' failuresSize: '+failuresSize);
process.exit();