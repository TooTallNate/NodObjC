/**
 * Wraps up Objective-C 'Classes'.
 * There can only be 1 instance of a given class (i.e. no naming collisions,
 * this is C we're dealing with here), so this module keeps a cache of the
 * created classes for when they are re-requested.
 */

var classCache = {}
  , core = require('./core')
  , wrapId = require('./id').wrapId
  , getClass = core.objc_getClass
  , getName = core.class_getName
  , getSuperclass = core.class_getSuperclass

// Gets a Class from the cache by name, if the cache has not been loaded
// prevously though 'registerClass()' then this returns undefined.
exports.getClass = function getClass (name) {
  return classCache[name];
}

// Register a Class globally. Classes are unique by name so this function
// should only be called once per class.
exports.registerClass = function registerName (name) {
  // get a pointer to the native Class
  var ptr = getClass(name)
  // wrap the Class pointer up as a nice JS object
  var wrap = wrapId(ptr)
  // cache and return all at once
  return classCache[name] = wrap;
}

// Calls the C 'class_getSuperclass' function on the given class reference in
// order to determine it's superclass. It's name is then retrieved and then
// a reference to the appropriate superclass is setup on the original class.
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
