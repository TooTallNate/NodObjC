/**
 * The 'id' function is essentially the "base class" for all Objective-C
 * objects that get passed around JS-land.
 */

var proto = exports.proto = Object.create(Function.prototype)
  , types = require('./types')

/**
 * Wraps up an ffi pointer that is expected to be a compatible Objective-C
 * object that can recieve messages.
 */
exports.wrap = function wrap (pointer) {

  // This 'id' function is syntax sugar around the msgSend function attached to
  // it. 'msgSend' is expecting the selector first, an Array of args second, so
  // this function just massages it into place and returns the result.
  function id (arg) {
    var sel = []
      , args = []
    if (arg.constructor.name == 'String') {
      sel = arg;
    } else {
      
    }
    return this._msgSend(sel, args);
  }

  // Save a reference to the pointer for msgSend
  id.__pointer__ = pointer;
  // The 'types' 
  id.__types__ = {};
  // Morph into a MUTANT FUNCTION FREAK!!1!
  id.__proto__ = proto;
  return id;
}


proto._msgSend = function msgSend (sel, args) {
  var types = this.__types__[sel];
  if (!types) types = this._getTypes
  var msgSendFunc = core.get_objc_msgSend(
  return sel;
}

proto.toString = function toString () {
  return this('description')('UTF8String');
}
