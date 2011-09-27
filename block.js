/**
 * Transforms C Blocks into JS Functions and vice-versa.
 *
 * Reference:
 *   http://clang.llvm.org/docs/Block-ABI-Apple.txt
 *   http://en.wikipedia.org/wiki/Blocks_(C_language_extension)
 */

exports.createBlock = createBlock
exports.getPointer = getPointer

var ffi = require('node-ffi')
  , core = require('./core')
  , imp = require('./imp')
  , id = require('./id')

// We have to simulate what the llvm compiler does when it encounters a Block
// literal expression:
var __block_literal_1 = ffi.Struct([
    ['pointer', 'isa']
  , ['int32', 'flags']
  , ['int32', 'reserved']
  , ['pointer', 'invoke']
  , ['pointer', 'descriptor']
])
//console.log(__block_literal_1.__structInfo__)
//console.log('sizeof __block_literal_1: %d', __block_literal_1.__structInfo__.size);

var __block_descriptor_1 = ffi.Struct([
    ['ulonglong', 'reserved']
  , ['ulonglong', 'Block_size']
])
//console.log('sizeof __block_descriptor_1: %d', __block_descriptor_1.__structInfo__.size);

// These values never change so we get to reuse the same one for every block
var BD = new __block_descriptor_1
BD.reserved = 0
BD.Block_size = ffi.sizeOf(__block_literal_1)


// The class of the block instances; lazy-loaded
var CGB

/**
 * Creates a C block instance from a JS function and returns it's pointer
 */
function createBlockPointer (func, type) {
  if (!func) return null
  var bl = new __block_literal_1
  // Set the class of the instance
  bl.isa = CGB || (CGB = core.dlopen().get('_NSConcreteGlobalBlock'))
  // Global flags
  bl.flags = 1 << 29
  bl.reserved = 0
  bl.invoke = imp.createWrapperPointer(func, type)
  bl.descriptor = BD.ref()
  return bl.ref()
}


/**
 * Creates a C block instance from a JS Function.
 * Blocks are regular Objective-C objects in Obj-C, and can be sent messages;
 * thus Block instances need are creted using the id.wrap() function.
 */
function createBlock (func, type) {
  return id.wrap(createBlockPointer(func, type))
}

/**
 * Gets an ffi pointer to a C block from an existing wrapped Block instance, or
 * creates a new block with _createBlock(). The second case should be most common
 * since it will be rare to create your own Block intstances and pass them around.
 */
function getPointer (blockOrFunc, type) {
  if (blockOrFunc instanceof id.proto) {
    return blockOrFunc.pointer
  } else {
    return createBlockPointer(blockOrFunc, type)
  }
}
