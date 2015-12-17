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

var Exception = require('vm').runInNewContext('Error');

/*!
 * Module exports.
 */

module.exports = Exception;

/*!
 * Module dependencies.
 */

var core = require('./core');
var extended = false;
var setPrototypeOf = require('setprototypeof');
var setFunctionName = require('function-name');

setFunctionName(Exception, 'Exception');
Object.defineProperty(Exception.prototype, 'name', {
  value: 'Exception'
});


/**
 * Wraps a `Pointer` that should be an Objective-C `NSException` instance.
 *
 * @api private
 */

Exception.wrap = function wrap (pointer, _parentFn) {
  if (!extended) {
    setPrototypeOf(Exception.prototype, require('./id').prototype);
    extended = true;
  }

  var w = core.createObject(pointer, '@', '_');

  setPrototypeOf(Object.getPrototypeOf(w), Exception.prototype);

  setFunctionName(w, w('name'));
  w.message = String(w('reason'));

  var parentFn = arguments.length >= 2 ? _parentFn : wrap;
  Error.captureStackTrace(w, parentFn);

  return w;
}
