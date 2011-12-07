
/**
 * **NodObjC** is the bridge between NodeJS and the Objective-C runtime and
 * frameworks, making it possible to write native Cocoa applications (both GUI and
 * command-line) using 100% NodeJS. Applications are written entirely in
 * JavaScript and interpreted at runtime.
 *
 * ## Getting Started
 *
 * Every **NodObjC** application begins with requiring the `NodObjC` module.
 * You can name the returned module variable anything you want, but the
 * "canonical" name for it is `$`. This is mostly because you're going to be using
 * the variable all over the place, and probably want to keep it short.
 *
 *     var $ = require('NodObjC')
 *
 * The next step is to [`import()`](import.html) a desired "Framework" that is
 * installed on the system. These frameworks are the APIs provided to Objective-C,
 * which could be the default frameworks (provided by Apple) or 3rd party
 * frameworks written by others (or you). The "Foundation" framework is the...
 * well.. foundation of these APIs, providing the most basic and important
 * classes like `NSString` and `NSArray`.
 *
 *     $.import('Foundation')
 *
 * [`import()`](import.html) doesn't return anything, however it will throw an
 * Error if anything goes wrong. What happens after the import call is that the
 * `$` variable now has a whole bunch of new properties attached to it, the
 * exports from the imported framework. At this point, you can fully interact
 * with these Objective-C classes, creating instances, subclassing, swizzling,
 * etc.
 *
 * A lot of core classes expect an `NSAutoreleasePool` instance on the stack, so
 * the first Objective-C object instance you create is usually one of those.
 *
 *     var pool = $.NSAutoreleasePool('alloc')('init')
 *
 * Pretty simple! You don't need to worry about the autorelease pool after this.
 * Now, for an example, try creating an `NSArray` instance, well, an
 * `NSMutableArray` technically, so we can also add an `NSString` to it.
 *
 *     var array = $.NSMutableArray('alloc')('init')
 *
 *     array('addObject', $('Hello World!'))
 *
 *     console.log(array)
 *     // (
 *     //     "Hello World!"
 *     // )
 *
 * So there's an `NSArray` instance with a `count` (Objective-C's version of
 * `Array#length`) of `1`, containing an `NSString` with the text "Hello World!".
 * From here on out, you will need to refer to your Cocoa documentation for the
 * rest of the available methods `NSArray` offers.
 *
 * ## Message Sending Syntax
 *
 * To send an Objective-C message to an Objective-C object using **NodObjC**, you
 * have to **invoke the object as a function**, where the **even number arguments
 * make up the message name** and the **odd numbered arguments are the arguments**
 * to send to the [object](id.html).
 *
 *     object('messageNameWithArg', someArg, 'andArg', anotherArg)
 *
 * This sounds and probably looks strange at first, but this is the cleanest
 * syntax while still being valid JS. It also maintains the "readabililty" of
 * typical Objective-C method names.
 *
 * ## Dynamic Object Introspection
 *
 * Since **NodObjC** runs in an interpreted environment, it is actually *very
 * easy* to dynamically inspect the defined methods, instance variables (ivars),
 * implemented protocols, and more of any given Objective-C object (a.k.a.
 * [`id`](id.html) instances).
 *
 * Using the same `array` instance as before, you can retreive a list of the
 * type of class, and it's subclasses, by calling the `.ancestors()` function.
 *
 *     array.ancestors()
 *     // [ '__NSArrayM',
 *     //   'NSMutableArray',
 *     //   'NSArray',
 *     //   'NSObject' ]
 *
 * Also commonly of interest are the given methods an object responds to. Use the
 * `.methods()` function for that.
 *
 *     array.methods()
 *     // [ 'addObject:',
 *     //   'copyWithZone:',
 *     //   'count',
 *     //   'dealloc',
 *     //   'finalize',
 *     //   'getObjects:range:',
 *     //   'indexOfObjectIdenticalTo:',
 *     //   'insertObject:atIndex:',
 *     //   'objectAtIndex:',
 *     //   'removeLastObject',
 *     //   'removeObjectAtIndex:',
 *     //   'replaceObjectAtIndex:withObject:' ]
 *
 * ## More Docs
 *
 * Check out the rest of the doc pages for some of the other important
 * **NodObjC** pieces.
 *
 *  * [Block](block.html) - How to use an Objective-C "block" function.
 *  * [Class](class.html) - Subclassing and adding methods at runtime.
 *  * [Exception](exception.html) - **NodObjC** exceptions *are* JavaScript `Error` objects.
 *  * [id](id.html) - The wrapper class for every Objective-C object.
 *  * [Import](import.html) - Importing "Frameworks" into the process.
 *  * [Ivars](ivar.html) - Instance variable definitions.
 *  * [Method](method.html) - Method definitions and swizzling.
 *  * [Structs](struct.html) - Using Structs and C functions in **NodObjC**.
 */

/*!
 * Module exports.
 */

module.exports = $

/*!
 * Load the node-ffi extensions.
 */

require('./ffi-extend')

/*!
 * Module dependencies.
 */

var Import = require('./import')

/*!
 * Set the initial exports onto the $ function.
 */

$.import  = Import.import
$.resolve = Import.resolve

/**
 * This function accepts native JS types (String, Number, Date) and converts them
 * to the proper Objective-C type (NSString, NSNumber, NSDate).
 *
 * Often times, you will use this function to cast a JS String into an NSString
 * for methods that accept NSStrings (since NodObjC doesn't automatically cast to
 * NSStrings in those instances).
 *
 *     var jsString = 'a javascript String'
 *     var nsString = $(jsString)
 *
 *     $.NSLog(nsString)
 *
 * @param {String|Number|Date} o the JS object to convert to a Cocoa equivalent type.
 * @return {id} The equivalent Cocoa type as the input object. Could be an `NSString`, `NSNumber` or `NSDate`.
 */

function $ (o) {
  var t = typeof o
  if (t == 'string') {
    return $.NSString('stringWithUTF8String', String(o))
  } else if (t == 'number') {
    return $.NSNumber('numberWithDouble', Number(o))
  } else if (isDate(o)) {
    return $.NSDate('dateWithTimeIntervalSince1970', o / 1000)
  }
  throw new Error('Unsupported object passed in to convert: ' + o)
}

/*!
 * Returns true if `d` is a `Date` instance.
 */

function isDate (d) {
  return d instanceof Date
      || Object.prototype.toString.call(d) == '[object Date]'
}
