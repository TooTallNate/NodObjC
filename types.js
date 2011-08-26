/**
 * Logic for translating a given Objective-C "type" encoding into a node-ffi
 * type.
 *
 * Reference: http://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html
 * node-ffi Type List: https://github.com/rbranson/node-ffi/wiki/Node-FFI-Tutorial#wiki-type-list
 */

var struct = require('./struct')
  , map = {
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
};

/**
 * Translates a single Obj-C 'type' into a valid node-ffi type.
 */
exports.map = function translate (type) {
  var rtn = map[type];
  if (rtn) return rtn;
  // Meh, need better testing here
  if (type[0] === '^') return 'pointer';
  rtn = map[type[type.length-1]];
  if (rtn) return rtn;
  if (struct.isStruct(type)) return struct.getStruct(type);
  throw new Error('Could not convert type: ' + type);
}
struct._typeMap = exports.map;

/**
 * Accepts an Array of ObjC return type and argument types (i.e. the result of
 * parse() below), and returns a new Array with the values mapped to valid ffi
 * types.
 */
exports.convert = function convert (types) {
  return types.map(function (type) {
    return Array.isArray(type) ? exports.convert(type) : exports.map(type);
  });
}

/**
 * Parses a "types string" (i.e. "v@:") and returns a "types Array", where the
 * return type is the first array value, and an Array of argument types is the
 * array second value.
 */
exports.parse = function parse (types) {
  if (types[1] !== '@' || types[2] !== ':')
    throw new Error('Invalid types string: '+types)
  return [ types[0], types.substring(1).split('') ]
}
