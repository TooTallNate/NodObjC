
/**
 * Logic for translating a given Objective-C "type" encoding into a node-ffi
 * type.
 *
 * ### References:
 *
 *   * [Apple "Type Encoding" Docs](http://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html)
 *   * [node-ffi "Type List"](https://github.com/rbranson/node-ffi/wiki/Node-FFI-Tutorial#wiki-type-list)
 */

/**
 * Module exports.
 */

exports.map = map
exports.mapArray = mapArray
exports.parse = parse

/**
 * Module dependencies.
 */

var struct = require('./struct')
  , assert = require('assert')

/**
 * A map of Objective-C type encodings to node-ffi types.
 *
 * @api private
 */

var typeEncodings = {
    'c': 'char'
  , 'i': 'int32'
  , 's': 'short'
  , 'l': 'long'
  , 'q': 'longlong'
  , 'C': 'uchar'
  , 'I': 'uint32'
  , 'S': 'ushort'
  , 'L': 'ulong'
  , 'Q': 'ulonglong'
  , 'f': 'float'
  , 'd': 'double'
  , 'B': 'int8'
  , 'v': 'void'
  , '*': 'string'   // String
  , '@': 'pointer'  // id
  , '#': 'pointer'  // Class
  , ':': 'pointer'  // SEL
  , '?': 'pointer'  // Unknown, used for function pointers
}
exports.typeEncodings = typeEncodings
var DELIMS = Object.keys(typeEncodings)

/**
 * A map of the additional type info for some ObjC methods.
 *
 * @api private
 */

var methodEncodings = {
    'r': 'const'
  , 'n': 'in'
  , 'N': 'inout'
  , 'o': 'out'
  , 'O': 'bycopy'
  , 'R': 'byref'
  , 'V': 'oneway'
}
exports.methodEncodings = methodEncodings

/**
 * Used to remove and method encodings present on the type.
 * NodObjC does not use them...
 */

var methodEncodingsTest = new RegExp('^(' + Object.keys(methodEncodings).join('|') + ')')

/**
 * Maps a single Obj-C 'type' into a valid node-ffi type.
 * This mapping logic is kind of a mess...
 */

function map (type) {
  if (!type) throw new Error('got falsey "type" to map ('+type+'). this should NOT happen!')
  if (type.type) type = type.type
  if (struct.isStruct(type)) return struct.getStruct(type)
  type = type.replace(methodEncodingsTest, '')
  // if the first letter is a ^ then it's a "pointer" type
  if (type[0] === '^') return 'pointer'
  // now we can try matching from the typeEncodings map
  var rtn = typeEncodings[type]
  if (rtn) return rtn
  // last shot... try the last char? this may be a bad idea...
  rtn = typeEncodings[type[type.length-1]]
  if (rtn) return rtn
  // couldn't find the type. throw a descriptive error as to why:
  if (type[0] == '[')
    throw new Error('Array types not yet supported: ' + type)
  if (type[0] == '(')
    throw new Error('Union types not yet supported: ' + type)
  if (type[0] == 'b')
    throw new Error('Bit field types not yet supported: ' + type)
  throw new Error('Could not convert type: ' + type)
}

/**
 * Accepts an Array of ObjC return type and argument types (i.e. the result of
 * parse() below), and returns a new Array with the values mapped to valid ffi
 * types.
 */

function mapArray (types) {
  return types.map(function (type) {
    return Array.isArray(type) ? exports.mapArray(type) : exports.map(type)
  })
}

/**
 * Parses a "types string" (i.e. `'v@:'`) and returns a "types Array", where the
 * return type is the first array value, and an Array of argument types is the
 * array second value.
 */

function parse (types) {
  if (typeof types === 'string') {
    var rtn = []
      , cur = []
      , len = types.length
      , depth = 0
    for (var i=0; i<len; i++) {
      var c = types[i]

      if (depth || !/(\d)/.test(c)) {
        cur.push(c)
      }

      if (c == '{' || c == '[' || c == '(') {
        depth++
      } else if (c == '}' || c == ']' || c == ')') {
        depth--
        if (!depth)
          add()
      } else if (~DELIMS.indexOf(c) && !depth) {
        add()
      }
    }
    function add () {
      rtn.push(cur.join(''))
      cur = []
      depth = 0
    }
    assert.equal(rtn[1], '@', '_self argument expected as first arg: ' + types)
    assert.equal(rtn[2], ':', 'SEL argument expected as second arg: ' + types)
    return [ rtn[0], rtn.slice(1) ]
  } else {
    var args = types.args
    assert.equal(args[0], '@', '_self argument expected as first arg: ' + types)
    assert.equal(args[1], ':', 'SEL argument expected as second arg: ' + types)
    return [ types.retval, args ]
  }
}
