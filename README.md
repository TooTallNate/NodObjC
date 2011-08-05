NodObjC
=======
### The Objective-C ⇆ [NodeJS][] bridge


`NodObjC` exposes the Objective-C runtime to [NodeJS][] in a high-level, easy
to use fashion. It uses the `BridgeSupport` files to dynamically generate an
API from an Objective-C "Framework" at runtime, and uses `node-ffi` to
dynamically interact with Objective-C's runtime.

Essentially, `NodObjC` is similar in nature to the other popular Objetive-C
scripting bridges:

 * [JSCocoa][]
 * [PyObjC][]
 * [CocoaRuby][]

So you can write Objective-C based applications entirely with Node and
JavaScript! Eventually even iOS native apps as well! So what are you waiting
for? Get to coding!

**Note:** This lib is still very much under development. It is not ready for
primetime quite yet. Watch this project to follow the updates!


Example
-------

``` javascript
var $ = require('NodObjC');

// First you need to "load" the Framework
var F = $.import('Foundation');

// Setup the recommended NSAutoreleasePool instance
F.NSAutoreleasePool('alloc')('init');

// Now let's create an NSMutableArray
var array = F.NSMutableArray('alloc')({ 'initWithCapacity': 3 });

// Add some JS objects to the array
array({ 'addObject': "Hello World!" });
array({ 'addObject': { an: 'object' } });
array({ 'addObject': NSMutableArray });

// Print out the contents (calling [array description])
console.log(array);
```

[NodeJS]: http://nodejs.org
[JSCocoa]: http://inexdo.com/JSCocoa
[PyObjC]: http://pyobjc.sourceforge.net
[CocoaRuby]: http://en.wikipedia.org/wiki/RubyCocoa
