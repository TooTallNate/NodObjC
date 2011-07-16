/**
 * Wraps up Objective-C 'Classes'.
 * There can only be 1 instance of a given class (i.e. no naming collisions,
 * this is C we're dealing with here), so this module keeps a cache of the
 * created classes for when they are re-requested.
 */

var classCache = {}
  , core = require('./core')
  , getClass = core.objc_getClass
  , getName = core.class_getName
  , getSuperclass = core.class_getSuperclass

exports.getClass = function getClass (name) {
  return classCache[name];
}

exports.registerClass = function registerName (name) {

  var ptr = getClass(name);
  function objc_class (selector) {

    var sel = selector
      , noArgs = typeof selector == 'string'

    if (!noArgs) {
      // selector with one or more arguments
      sel = Object.keys(selector).join(':')+':';
    }
    // TODO: cache SEL references
    var selRef = core.sel_registerName(sel)
      , args = [ objc_class._ptr, selRef ]
      , method = objc_class[sel]
      , msgSend = core.get_objc_msgSend(method)
    if (!noArgs) {
      for (var arg in selector) {
        // TODO: Unwrap any wrapped up ObjC objects
        // TODO: Wrap up regular JS objects so they can be passed to ObjC
        args.push(selector[arg]);
      }
    }
    var rtn = msgSend.apply(null, args);
    //console.error(rtn);
    return rtn;
  }
  objc_class.prototype = {};
  objc_class._ptr = ptr;

  classCache[name] = objc_class;
  return objc_class;
}

exports.setupInheritance = function setupInheritance (clazz) {
  var superclass = getSuperclass(clazz._ptr)
  if (!superclass.isNull()) {
    var name = getName(superclass)
      , superRef = exports.getClass(name);
    if (!superRef) {
      // I don' think this should ever happen but just in case...
      superRef = exports.registerClass(name);
    }
    clazz.__proto__ = superRef;
    clazz.prototype.__proto__ = superRef.prototype;
  }
}
