/**
 * Wraps up Objective-C 'Classes'.
 * There can only be 1 instance of a given class (i.e. no naming collisions,
 * this is C we're dealing with here), so this module keeps a cache of the
 * created classes for when they are re-requested.
 */

var classCache = {}
  , core = require('./core')
  , objc_getClass = core.objc_getClass
  , class_getName = core.class_getName

exports.getClass = function getClass (name) {
  return classCache[name];
}

exports.registerClass = function registerName (name) {

  var ptr = objc_getClass(name);
  function objc_class (selector) {
    
  }
  objc_class.prototype = {};
  objc_class.ptr = ptr;

  classCache[name] = objc_class;
  return objc_class;
}
