
/**
 * This 'core' module is the `libffi` wrapper. All required native
 * functionality is instantiated and then exported in this module.
 */

/**
 * Module dependencies.
 */

var ffi = require('node-ffi')
  // 'uintptr_t' isn't natively supported by node-ffi
  , uintptr_t = ffi.Bindings.POINTER_SIZE == 8 ? 'uint64' : 'uint32'
  // TODO: These static ffi bindings could be replaced with native bindings
  //       for a speed boost.
  , objc = new ffi.Library('libobjc', {
      class_addIvar: [ 'uint8', [ 'pointer', 'string', 'size_t', 'uint8', 'string' ] ]
    , class_addMethod: [ 'uint8', [ 'pointer', 'pointer', 'pointer', 'string' ] ]
    , class_addProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
    , class_copyIvarList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_copyMethodList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getClassMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getClassVariable: [ 'pointer', [ 'pointer', 'string' ] ]
    , class_getInstanceMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_getInstanceSize: [ 'size_t', [ 'pointer' ] ]
    , class_getInstanceVariable: [ 'pointer', [ 'pointer', 'string' ] ]
    , class_getIvarLayout: [ 'string', [ 'pointer' ] ]
    , class_getName: [ 'string', [ 'pointer' ] ]
    , class_getProperty: [ 'pointer', [ 'pointer', 'string' ] ]
    , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
    , class_getVersion: [ 'int32', [ 'pointer' ] ]
    , class_getWeakIvarLayout: [ 'string', [ 'pointer' ] ]
    , class_isMetaClass: [ 'uint8', [ 'pointer' ] ]
    , class_setIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
    , class_setSuperclass: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , class_setVersion: [ 'void', [ 'pointer', 'int32' ] ]
    , class_setWeakIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
    , ivar_getName: [ 'string', [ 'pointer' ] ]
    , ivar_getOffset: [ 'int32', [ 'pointer' ] ]
    , ivar_getTypeEncoding: [ 'string', [ 'pointer' ] ]
    , method_copyArgumentType: [ 'pointer', [ 'pointer', 'uint32' ] ]
    , method_copyReturnType: [ 'pointer', [ 'pointer' ] ]
    , method_exchangeImplementations: [ 'void', [ 'pointer', 'pointer' ] ]
    , method_getImplementation: [ 'pointer', [ 'pointer' ] ]
    , method_getName: [ 'pointer', [ 'pointer' ] ]
    , method_getNumberOfArguments: [ 'uint32', [ 'pointer' ] ]
    , method_getTypeEncoding: [ 'string', [ 'pointer' ] ]
    , method_setImplementation: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , objc_allocateClassPair: [ 'pointer', [ 'pointer', 'string', 'size_t' ] ]
    , objc_copyProtocolList: [ 'pointer', [ 'pointer' ] ]
    , objc_getAssociatedObject: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , objc_getClass: [ 'pointer', [ 'string' ] ]
    , objc_getClassList: [ 'int32', [ 'pointer', 'int32' ] ]
    , objc_getProtocol: [ 'pointer', [ 'string' ] ]
    , objc_registerClassPair: [ 'void', [ 'pointer' ] ]
    , objc_removeAssociatedObjects: [ 'void', [ 'pointer' ] ]
    , objc_setAssociatedObject: [ 'void', [ 'pointer', 'pointer', 'pointer', uintptr_t ] ]
    , object_getClass: [ 'pointer', [ 'pointer' ] ]
    , object_getClassName: [ 'string', [ 'pointer' ] ]
    , object_getInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
    , object_getIvar: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , object_setClass: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , object_setInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
    , object_setIvar: [ 'void', [ 'pointer', 'pointer', 'pointer' ] ]
    , property_getAttributes: [ 'string', [ 'pointer' ] ]
    , property_getName: [ 'string', [ 'pointer' ] ]
    , protocol_conformsToProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
    , protocol_copyMethodDescriptionList: [ 'pointer', [ 'pointer', 'uint8', 'uint8', 'pointer' ] ]
    , protocol_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , protocol_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
    , protocol_getMethodDescription: [ 'pointer', [ 'pointer', 'pointer', 'uint8', 'uint8' ] ]
    , protocol_getName: [ 'string', [ 'pointer' ] ]
    , protocol_getProperty: [ 'pointer', [ 'pointer', 'string', 'uint8', 'uint8' ] ]
    , sel_getName: [ 'string', [ 'pointer' ] ]
    , sel_registerName: [ 'pointer', [ 'string' ] ]
  })
  , msgSendCache = {}

exports.__proto__ = objc

// Expose `node-ffi` stuff so we don't have to require node-ffi elsewhere
exports.Struct = ffi.Struct
exports.Pointer = ffi.Pointer
exports.Callback = ffi.Callback
exports.ForeignFunction = ffi.ForeignFunction
exports.TYPE_SIZE_MAP = ffi.Bindings.TYPE_SIZE_MAP

exports.dlopen = function dlopen (path) {
  return new ffi.DynamicLibrary(path)
}

exports.process = exports.dlopen()

/**
 * Convienience function to return an Array of Strings of the names of every
 * class currently in the runtime. This gets used at the during the import
 * process get a name of the new classes that have been loaded.
 * TODO: Could be replaced with a native binding someday for speed. Not overly
 *       important as this function is only called during import()
 */
exports.getClassList = function getClassList () {
  // First get just the count
  var num = objc.objc_getClassList(null, 0)
    , rtn = []
  if (num > 0) {
    var s = ffi.Bindings.TYPE_SIZE_MAP.pointer
      , c = null
      , classes = new ffi.Pointer(s * num)
      , cursor = classes
    objc.objc_getClassList(classes, num)
    for (var i=0; i<num; i++) {
      c = cursor.getPointer()
      rtn.push(objc.class_getName(c))
      cursor = cursor.seek(s)
    }
    // free() not needed since ffi allocated the buffer, and will free() with V8's GC
  }
  return rtn
}

/**
 * Gets a list of the currently loaded Protocols in the runtime.
 */
exports.copyProtocolList = function copyProtocolList () {
  var num = new ffi.Pointer(exports.TYPE_SIZE_MAP.uint32)
    , rtn = []
    , protos = objc.objc_copyProtocolList(num)
    , p = protos
    , count = num.getUInt32()
  for (var i=0; i<count; i++) {
    var cur = p.getPointer()
      , name = objc.protocol_getName(cur)
    rtn.push(name)
    p = p.seek(exports.TYPE_SIZE_MAP.pointer)
  }
  ffi.free(protos)
  return rtn
}

/**
 * Copies and returns an Array of the instance variables defined by a given
 * Class pointer. To get class variables, call this function on a metaclass.
 */
exports.copyIvarList = function copyIvarList (classPtr) {
  var numIvars = new ffi.Pointer(exports.TYPE_SIZE_MAP.uint32)
    , rtn = []
    , ivars = exports.class_copyIvarList(classPtr, numIvars)
    , p = ivars
    , count = numIvars.getUInt32()
  for (var i=0; i<count; i++) {
    var cur = p.getPointer()
      , name = exports.ivar_getName(cur)
    rtn.push(name)
    p = p.seek(exports.TYPE_SIZE_MAP.pointer)
  }
  ffi.free(ivars)
  return rtn
}

/**
 * Copies and returns an Array of the instance methods the given Class pointer
 * implements. To get class methods, call this function with a metaclass.
 */
exports.copyMethodList = function copyMethodList (classPtr) {
  var numMethods = new ffi.Pointer(exports.TYPE_SIZE_MAP.uint32)
    , rtn = []
    , methods = exports.class_copyMethodList(classPtr, numMethods)
    , p = methods
    , count = numMethods.getUInt32()
  for (var i=0; i<count; i++) {
    var cur = p.getPointer()
      , name = SEL.toString(exports.method_getName(cur))
    rtn.push(name)
    p = p.seek(exports.TYPE_SIZE_MAP.pointer)
  }
  ffi.free(methods)
  return rtn
}

/**
 * Iterates over the Methods defined by a Protocol.
 */
exports.copyMethodDescriptionList = function copyMethodDescriptionList (protocolPtr, required, instance) {
  var numMethods = new ffi.Pointer(exports.TYPE_SIZE_MAP.uint32)
    , methods = exports.protocol_copyMethodDescriptionList(protocolPtr, required, instance, numMethods)
    , rtn = []
    , p = methods
    , count = numMethods.getUInt32()
  for (var i=0; i<count; i++) {
    var cur = new exports.objc_method_description(p)
    rtn.push(SEL.toString(cur.name))
    p = p.seek(ffi.sizeOf(exports.objc_method_description))
  }
  ffi.free(methods)
  return rtn
}

/**
 * Convienience function to get the String return type of a Method pointer.
 * Takes care of free()ing the returned pointer, as is required.
 */
exports.getMethodReturnType = function getMethodReturnType (method) {
  return getStringAndFree(objc.method_copyReturnType(method))
}

exports.getMethodArgTypes = function getMethodArgTypes (method) {
  var num = objc.method_getNumberOfArguments(method)
    , rtn = []
  for (var i=2; i<num; i++) {
    rtn.push(getStringAndFree(objc.method_copyArgumentType(method, i)))
  }
  return rtn
}

exports.getStringAndFree = function getStringAndFree (ptr) {
  var str = ptr.getCString()
  ffi.free(ptr)
  return str
}

// Creates and/or returns an appropriately wrapped up 'objc_msgSend' function
// based on the given Method description info.
exports.get_objc_msgSend = function get_objc_msgSend (objcTypes) {
  var type = []
    , rtn = [ types.map(objcTypes[0]), type ]
    , args = objcTypes[1]
    , i = 0
    , l = args.length
  for (; i<l; i++) {
    type.push(types.map(args[i]))
  }
  // Stringify the types
  var key = rtn.toString()
  //console.warn('INFO: types key: %s', key)

  // first check the cache
  if (msgSendCache[key]) return msgSendCache[key]
  //console.warn('WARN: key not found in cache, generating new copy: %s', key)

  // If we got here, then create a new objc_msgSend ffi wrapper
  // TODO: Don't use the Library helper, use ffi low-level API
  var lib = new ffi.Library(null, {
    objc_msgSend: rtn
  })
  // return and cache at the same time
  return msgSendCache[key] = lib.objc_msgSend
}


// Struct type returned by `protocol_getMethodDescription`.
exports.objc_method_description = ffi.Struct([
    ['pointer', 'name']
  , ['string', 'types']
])


/**
 * Wraps up a node-ffi pointer if needed (not needed for Numbers, etc.)
 */
exports.wrapValue = function wrapValue (val, type) {
  //console.error('wrapValue(): %s, %j', val, type)
  if (val === null || (val.isNull && val.isNull())) return null
  var rtn = val
  if (type.function_pointer) {
    if (type.type == '@?') {
      return block.createBlock(val, type)
    } else {
      return IMP.createUnwrapperFunction(val, type)
    }
  }
  // get the raw type from Type objects
  if (type.type) type = type.type
  if (type == '@') {
    rtn = id.wrap(val)
  } else if (type == '#') {
    rtn = Class.wrap(val)
  } else if (type == ':') {
    rtn = SEL.toString(val)
  } else if (type == 'B') {
    rtn = val ? true : false
  }
  if (rtn)
    rtn._type = type
  return rtn
}

/**
 * Accepts an Array of raw objc pointers and other values, and an array of ObjC
 * types, and returns an array of wrapped values where appropriate.
 */
exports.wrapValues = function wrapValues (values, types) {
  var len = values.length
    , rtn = []
  for (var i=0; i<len; i++) {
    rtn.push(exports.wrapValue(values[i], types[i]))
  }
  return rtn
}

/**
 * Unwraps a previously wrapped NodObjC object.
 */
exports.unwrapValue = function unwrapValue (val, type) {
  //console.error('unwrapValue(): %s, %j', val, type)
  var rtn = val
  if (type.function_pointer) {
    if (type.type == '@?') {
      return block.getPointer(val, type)
    } else {
      return IMP.createWrapperPointer(val, type)
    }
  }
  // get the raw type from Type objects
  if (type.type) type = type.type
  if (type == '@' || type == '#') {
    if (!val) return null
    rtn = val.pointer
  } else if (type == ':') {
    rtn = SEL.toSEL(val)
  }
  if (rtn)
    rtn._type = type
  return rtn
}

/**
 * Accepts an Array of wrapped NodObjC objects and other values, and an array
 * of their cooresponding ObjC types, and returns an array of unwrapped values.
 */
exports.unwrapValues = function unwrapValues (values, types) {
  var len = values.length
    , rtn = []
  for (var i=0; i<len; i++) {
    rtn.push(exports.unwrapValue(values[i], types[i]))
  }
  return rtn
}

var types = require('./types')
  , SEL = require('./sel')
  , id = require('./id')
  , Class = require('./class')
  , IMP = require('./imp')
  , block = require('./block')
