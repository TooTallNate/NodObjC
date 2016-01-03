/**
 * `NodObjC` makes it seamless to catch Objective-C exceptions, using the standard
 * JavaScript `try`/`catch` syntax you are already familiar with.
 *
 * When an Objective-C method or function throws an `NSException`, you can catch
 * the exception and inspect it further. The error object that gets passed can be
 * invoked to send messages, just like any other Objective-C object in `NodObjC`.
 * The error object also has it's `message` and `stack` properties set, so that
 * you can easily retrieve the error message and get a dump of the stack trace.
 *
 *     var array = $.NSMutableArray('alloc')('init')
 *
 *     try {
 *
 *       // This will throw an exception since you can't add a null pointer
 *       array('addObject', null)
 *
 *     } catch (err) {
 *
 *       err('name')
 *       // 'NSInvalidArgumentException'
 *
 *       err('reason')
 *       // '*** -[__NSArrayM insertObject:atIndex:]: object cannot be nil'
 *
 *       err('reason') == err.message
 *       // true
 *
 *       err.stack
 *       // NSInvalidArgumentException: *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
 *       //     at Function.msgSend (/Users/nrajlich/NodObjC/lib/id.js:139:21)
 *       //     at id (/Users/nrajlich/NodObjC/lib/id.js:105:15)
 *       //     at Object.<anonymous> (/Users/nrajlich/NodObjC/array-exception.js:8:3)
 *       //     at Module._compile (module.js:411:26)
 *       //     at Object..js (module.js:417:10)
 *       //     at Module.load (module.js:343:31)
 *       //     at Function._load (module.js:302:12)
 *       //     at Array.0 (module.js:430:10)
 *       //     at EventEmitter._tickCallback (node.js:126:26)
 *
 *     }
 */

/*!
 * Module exports.
 */

module.exports = Exception;

/*!
 * Module dependencies.
 */

var ID = require('./id');
var inherits = require('./inherits');
var createFunction = require('function-class');

function Exception (pointer, _parentFn) {
  var _id = ID(pointer);
  var name = _id('name')('UTF8String');

  if (typeof this !== 'function')
    return createFunction(name, 0, Exception, arguments);

  ID.call(this, pointer);

  this.message = this('reason')('UTF8String');

  var parentFn = arguments.length >= 2 ? _parentFn : Exception;
  Error.captureStackTrace(this, parentFn);
}
inherits(Exception, ID);

Exception.prototype.toString = Error.prototype.toString;
