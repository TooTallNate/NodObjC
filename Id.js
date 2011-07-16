/**
 * The 'Id' module houses the generic message sending logic. Also a method to
 * wrap arbitrary 'id' to JS, used throughout NodObjC.
 */
var core = require('./core')

// Wraps up a node-ffi 'pointer' instance to a JS object. The pointer must be
// an 'id' (must be able to do ObjC message passing) or a subclass.
exports.wrapId = function (ptr) {

  // This named function is the wrapped JS object itself. The function
  // reference is passed around to the user, and the function itself should be
  // invoked in order to do Objective-C style "message passing".
  function objc_id (selector) {
    if (!selector) throw new Error("A 'selector' argument is required!");

    var sel = selector
      , noArgs = typeof selector == 'string'

    if (!noArgs) {
      // selector with one or more arguments
      sel = Object.keys(selector).join(':')+':';
    }
    // TODO: cache SEL references
    var selRef = core.sel_registerName(sel)
      , args = [ objc_id._ptr, selRef ]
      , method = objc_id[sel]
      , msgSend = core.get_objc_msgSend(method)
    if (!noArgs) {
      for (var arg in selector) {
        // TODO: Unwrap any wrapped up ObjC objects
        // TODO: Wrap up regular JS objects so they can be passed to ObjC
        // TODO: If the method requires an NSString, and a JS String was
        //       passed, then create an NSString instance for the user.
        args.push(selector[arg]);
      }
    }
    var rtn = msgSend.apply(null, args);
    // TODO: Wrap result when it's an 'id' pointer
    //console.error(rtn);
    return rtn;
  }
  objc_id._ptr = ptr;
  return objc_id;
}
