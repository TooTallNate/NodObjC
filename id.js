/**
 * The 'id' function is essentially the "base class" for all Objective-C
 * objects that get passed around JS-land.
 */

var proto = exports.proto = Object.create(Function.prototype)
  , core  = require('./core')
  , types = require('./types')
  , SEL   = require('./sel')

/**
 * Wraps up a pointer that is expected to be a compatible Objective-C
 * object that can recieve messages.
 */
exports.wrap = function wrap (pointer) {

  // This 'id' function is syntax sugar around the msgSend function attached to
  // it. 'msgSend' is expecting the selector first, an Array of args second, so
  // this function just massages it into place and returns the result.
  function id () {
    var args = []
      , sel
    if (arguments.length === 1) {
      var arg = arguments[0]
      if (arg.constructor.name == 'String') {
        sel = arg
      } else {
        sel = []
        Object.keys(arg).forEach(function (s) {
          sel.push(s)
          args.push(arg[s])
        })
        sel.push('')
        sel = sel.join(':')
      }
    } else {
      sel = []
      var len = arguments.length
      for (var i=0; i<len; i+=2) {
        sel.push(arguments[i])
        args.push(arguments[i+1])
      }
      sel.push('')
      sel = sel.join(':')
    }
    return id.msgSend(sel, args)
  }

  // Save a reference to the pointer for msgSend
  id.pointer = pointer;
  // Morph into a MUTANT FUNCTION FREAK!!1!
  id.__proto__ = proto;
  return id;
}
// Avoid a circular dep.
core._idwrap = exports.wrap;

proto.msgSend = function msgSend (sel, args) {
  var types = this._getTypes(sel)
    , argTypes = types[1]
    , msgSendFunc = core.get_objc_msgSend(types)
    , selRef = SEL.toSEL(sel)
    , unwrappedArgs = args.map(function (a, i) {
        return core.unwrapValue(a, argTypes[i]);
      })
    , rtn = msgSendFunc.apply(null, [ this.pointer, selRef ].concat(unwrappedArgs))
  //console.error(types);
  //console.error(rtn);
  // Process the return value into a wrapped value if needed
  return core.wrapValue(rtn, types[0]);
}

proto.toString = function toString () {
  return this('description')('UTF8String');
}

/**
 * Accepts a SEL and queries the current object for the return type and
 * argument types for the given selector. If current object does not implment
 * that selector, then check the superclass, and repeat recursively until
 * a subclass that responds to the selector is found, or until the base class
 * is found (in which case the current obj does not respond to 'sel' and we
 * should throw an Error).
 */
proto._getTypes = function getTypes (sel) {
  var c = this.getClass()
    , t = c._getTypesClass(sel, this.isClass)
  if (!t) throw new Error('Object does not respond to selector: '+sel);
  return t;
}

/**
 * Retrieves the wrapped Class instance for a given object.
 */
proto.getClass = function getClass () {
  var className = core.object_getClassName(this.pointer);
  return exports._getClass(className);
}

proto._getClassPointer = function getClassPointer () {
  return core.object_getClass(this.pointer)
}

proto.listMethods = function listMethods (maxDepth) {
  var numMethods = new core.Pointer(core.TYPE_SIZE_MAP.uint32)
    , rtn = []
    , classPointer = this._getClassPointer()
    , md = maxDepth || 1
    , depth = 0
  while (depth++ < md && !classPointer.isNull()) {
    var methods = core.class_copyMethodList(classPointer, numMethods)
      , p = methods
      , count = numMethods.getUInt32()
    for (var i=0; i<count; i++) {
      var cur = p.getPointer()
        , name = SEL.toString(core.method_getName(cur))
      if (!~rtn.indexOf(name)) {
        rtn.push(name)
      }
      p = p.seek(core.TYPE_SIZE_MAP.pointer)
    }
    core.free(methods)
    classPointer = core.class_getSuperclass(classPointer)
  }
  return rtn
}
