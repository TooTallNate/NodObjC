/**
 * Logic for translating a given Objective-C "type" encoding into a node-ffi
 * type.
 *
 * Reference: http://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html
 * node-ffi Type List: https://github.com/rbranson/node-ffi/wiki/Node-FFI-Tutorial#wiki-type-list
 */

var map = {
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

// Translate an Obj-C 'type' into a valid node-ffi type.
function translate (type) {
  var rtn = map[type];
  if (rtn) return rtn;
  // Meh, need better testing here
  if (type[0] === '^') return 'pointer';
  rtn = map[type[type.length-1]];
  if (rtn) return rtn;
  if (type[0] === '{') return 'pointer'; // TODO: Better struct parsing
  throw new Error('Could not convert type: ' + type);
}
exports.map = translate;
