NodObjC
=======
### The [Node.js][] ⇆ [Objective-C][ObjCWikipedia] bridge
[![Build Status](https://travis-ci.org/TooTallNate/NodObjC.svg?branch=master)](https://travis-ci.org/TooTallNate/NodObjC)


`NodObjC` exposes the Objective-C runtime to [Node.js][] in a high-level, easy
to use fashion. It uses the `BridgeSupport` files to dynamically generate an
API from an Objective-C "Framework", and uses the node `ffi` module to dynamically interact
with the Objective-C runtime.

Essentially, `NodObjC` is similar in nature to the other popular Objective-C
scripting bridges:

 * [JSCocoa][]
 * [PyObjC][]
 * [MacRuby][]
 * [And the others…][others]

So you can write entire Cocoa or iOS GUI applications entirely in Node.js
JavaScript! Applications are interpreted at runtime through the V8 engine,
rather than (pre)compiled to a (binary) machine exectuable. This has the advantage of being
able to tweak code without having to recompile; excellent for rapid prototyping
and development (or for those GUI applications where absolute speed is not a
requirement, i.e. _most_). So what are you waiting for? Get to coding!


Installation
------------

Install using `npm`, of course!

``` bash
$ npm install nodobjc
```

Or add it to the `"dependencies"` section of your _package.json_ file.


Hello World
-----------

``` javascript
var $ = require('nodobjc')

// First you import the "Foundation" framework
$.framework('Foundation')

// Setup the recommended NSAutoreleasePool instance
var pool = $.NSAutoreleasePool('alloc')('init')

// NSStrings and JavaScript Strings are distinct objects, you must create an
// NSString from a JS String when an Objective-C class method requires one.
var string = $.NSString('stringWithUTF8String', 'Hello Objective-C World!')

// Print out the contents (toString() ends up calling [string description])
console.log(string)
//   → Prints "Hello Objective-C World!"

pool('drain')
```

Be sure to check out the [full API docs][docs].


Introduction
------------

This module offers a bi-directional bridge between Node.js and the Objective-C
runtime. What does that mean exactly? Well due to the design of the Objective-C
runtime, it is possible to _port_ the entire API to other languages. There are
quite a few bridges for Obj-C so one for node was a necessity.

So with this module, you get access to _all_ of the Objective-C APIs, but you
invoke them through JavaScript. Obj-C has a concept of "message passing" to
invoke methods on objects. The way that you pass messages around is probably a
little bit different than the kind of JavaScript you're used to:

``` javascript
// In JavaScript, you invoke a function on an object like:
obj.func(arg)
```

Compared to:

``` javascript
// In NodObjC, you send a message to an object like:
obj('func', arg)
```

In Objective-C, the names of methods are part of the arguments that you pass
along:

``` objective-c
[array insertObject: obj
       atIndex: 5]
```

The equivalent of the above message invocation in NodObjC syntax would be:

``` javascript
array('insertObject', obj,
      'atIndex', 5)
```

So the even numbered arguments are the parts of the method name that will be
invoked, and the odd numbered arguments are the Obj-C arguments themselves. In
the above example, the `insertObject:atIndex:` function will be invoked.

In `NodObjC`, not only is the Objective-C runtime exposed, but so are the
corresponding C functions that usually go along with these APIs (thanks to
BridgeSupport). So for example, we can make an `NSRect` by calling the
`NSMakeRect()` C function:

``` javascript
$.NSMakeRect(5, 10, 8, 30)
// -> NSRect struct
```

There's a plethora of other Objective-C resources and tutorials out there.

You should definitely have Apple's official [Mac][MacDev] or [iOS][iOSDev] API
docs handy at all times.

Support / Getting Involved
---------------------------

If you're looking for support for developing with/for `NodObjC` you might want
to join the [mailing list][group], and check out the [#nodobjc][IRC] channel
in the Freenode IRC server.

Additional topics of discussion can be found on the [Wiki][] page.


[docs]: http://tootallnate.github.io/NodObjC
[group]: https://groups.google.com/d/forum/nodobjc
[Node.js]: http://nodejs.org
[JSCocoa]: http://inexdo.com/JSCocoa
[PyObjC]: http://pyobjc.sourceforge.net
[MacRuby]: http://macruby.org
[IRC]: http://webchat.freenode.net/?channels=nodobjc
[Wiki]: https://github.com/TooTallNate/NodObjC/wiki
[MacDev]: http://developer.apple.com/library/mac/navigation/
[iOSDev]: http://developer.apple.com/library/ios/navigation/
[ObjCWikipedia]: http://en.wikipedia.org/wiki/Objective-C
[others]: http://cocoadev.com/CocoaBridges
