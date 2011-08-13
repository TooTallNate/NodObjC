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
var $ = require('NodObjC')

// First you need to "import" the Framework
$.import('Foundation')

// Setup the recommended NSAutoreleasePool instance
var pool = $.NSAutoreleasePool('alloc')('init')

// NSStrings and JavaScript Strings are distinct objects, you must create an
// NSString from a JS String when an Objective-C class method requires one.
var string = $.NSString('stringWithUTF8String', 'Hello Objective-C World!')

// Print out the contents (calling [string description])
console.log('%s', string)
  → Prints "Hello Objective-C World"

pool('drain')
```

[NodeJS]: http://nodejs.org
[JSCocoa]: http://inexdo.com/JSCocoa
[PyObjC]: http://pyobjc.sourceforge.net
[CocoaRuby]: http://en.wikipedia.org/wiki/RubyCocoa
