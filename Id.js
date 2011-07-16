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
      , keys

    if (!noArgs) {
      // selector with one or more arguments
      keys = Object.keys(selector);
      sel = keys.join(':')+':';
    }
    // TODO: cache SEL references
    var selRef = core.sel_registerName(sel)
      , args = [ objc_id._ptr, selRef ]
      // TODO: add logic for when an unknown selector is passed. All arguments
      //       and the return value should be assumed to be 'id' in that case.
      , method = objc_id[sel]
      , msgSend = core.get_objc_msgSend(method)
    if (!noArgs) {
      method.args.forEach(function (arg, i) {
        // TODO: Unwrap any wrapped up ObjC objects
        // TODO: Wrap up regular JS objects so they can be passed to ObjC
        var val = keys[i];
        if (arg.declared_type == 'NSString*' && typeof val == 'string') {
          // TODO: If the method requires an NSString, and a JS String was
          //       passed, then create an NSString instance for the user.
        } else if (core.objcToFfi(arg) == 'pointer') {
          val = val._ptr;
        } else {
          // Pass the given argument as-is
          val = selector[val];
        }
        args.push(val);
      });
    }
    var rtn = msgSend.apply(null, args);
    if (core.objcToFfi(method.retval) == 'pointer') {
      rtn = exports.wrapId(rtn);
      if (sel == 'alloc') {
        // 'alloc' inherits from the Class' prototype
        rtn.__proto__ = objc_id.prototype;
      } else if (/^init/.test(sel)) {
        // a selector that begins with 'init' inherits from the current type
        rtn.__proto__ = objc_id.__proto__;
      }
      // TODO: Setup the proper inheritance based on the 'declared_type'
    }
    //console.error(rtn);
    return rtn;
  }
  objc_id._ptr = ptr;
  return objc_id;
}
