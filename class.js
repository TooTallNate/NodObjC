var core = require('./core')
  , SEL = require('./sel')
  , id = require('./id')
  , classCache = {}

var proto = exports.proto = Object.create(id.proto);

exports.getClass = function (c) {
  var pointer = core.objc_getClass(c);
  return classCache[c] = exports.wrap(pointer);
}
// Making the getClass function available to the id module, to avoid circular deps
id._getClass = exports.getClass;

exports.wrap = function wrap (pointer) {
  var w = id.wrap(pointer);
  w.isClass = true;
  w.__proto__ = proto;
  return w;
}

/**
 * Get's a Class instance's superclass. If the current class is a base class,
 * then this will return null.
 * TODO: Caching
 */
proto.getSuperclass = function getSuperclass () {
  var superclassPointer = core.class_getSuperclass(this.pointer)
  if (superclassPointer.isNull()) return null;
  var name = core.class_getName(superclassPointer)
    , superclass = exports.getClass(name)
  return superclass;
}

proto.getInstanceMethod = function getInstanceMethod (sel) {
  return core.class_getInstanceMethod(this.pointer, SEL.toSEL(sel));
}

proto.getClassMethod = function getClassMethod (sel) {
  return core.class_getClassMethod(this.pointer, SEL.toSEL(sel));
}


proto._getTypesClass = function getTypesClass (sel, isClass) {
  //console.error('_getTypesClass: %s, isClass: %d', sel, isClass);
  var method = this['get'+(isClass ? 'Class' : 'Instance')+'Method'](sel);
  if (method.isNull()) return null;
  return [ core.getMethodReturnType(method), core.getMethodArgTypes(method) ];
}
