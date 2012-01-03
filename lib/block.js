
/**
 * **NOTE:** C Block support in NodObjC is currently _experimental_!
 *
 * **NodObjC** implements support for [C Blocks][]!
 *
 * ### References:
 *
 *  * [Wikipedia "Blocks (C language extension)"][C Blocks]
 *  * http://clang.llvm.org/docs/Block-ABI-Apple.txt
 *
 * [C Blocks]: http://en.wikipedia.org/wiki/Blocks_%28C_language_extension%29
 */


/*!
 * Module exports.
 */

exports.createBlock = createBlock
exports.getPointer = getPointer

/*!
 * Module dependencies.
 */

var ffi = require('node-ffi')
  , core = require('./core')
  , imp = require('./imp')
  , id = require('./id')

/**
 * We have to simulate what the llvm compiler does when it encounters a Block
 * literal expression (see `Block-ABI-Apple.txt` above).
 * The "block literal" is the struct type for each Block instance.
 */

var __block_literal_1 = ffi.Struct([
    ['pointer', 'isa']
  , ['int32', 'flags']
  , ['int32', 'reserved']
  , ['pointer', 'invoke']
  , ['pointer', 'descriptor']
])

/**
 * The "block descriptor" is a static singleton struct. Probably used in more
 * complex Block scenarios involving actual closure variables needing storage
 * (in `NodObjC`, JavaScript closures are leveraged instead).
 */

var __block_descriptor_1 = ffi.Struct([
    ['ulonglong', 'reserved']
  , ['ulonglong', 'Block_size']
])

var BD = new __block_descriptor_1()
BD.reserved = 0
BD.Block_size = ffi.sizeOf(__block_literal_1)


// The class of the block instances; lazy-loaded
var CGB

/**
 * Creates a C block instance from a JS function and returns it's pointer.
 *
 * @api private
 */

function createBlockPointer (func, type) {
  if (!func) return null
  var bl = new __block_literal_1
  // Set the class of the instance
  bl.isa = CGB || (CGB = core.process.get('_NSConcreteGlobalBlock'))
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
 *
 * @api private
 */

function createBlock (func, type) {
  return id.wrap(createBlockPointer(func, type))
}

/**
 * Gets an ffi pointer to a C block from an existing wrapped Block instance, or
 * creates a new block with _createBlock(). The second case should be most common
 * since it will be rare to create your own Block intstances and pass them around.
 *
 * @api private
 */

function getPointer (blockOrFunc, type) {
  if ('pointer' in blockOrFunc) {
    return blockOrFunc.pointer
  } else {
    return createBlockPointer(blockOrFunc, type)
  }
}
