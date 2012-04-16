var b = require('../../lib/core')
  , assert = require('assert')

var NSMutableSet = b.objc_getClass('NSMutableSet')
  , NSAutoreleasePool = b.objc_getClass('NSAutoreleasePool')

var alloc = b.sel_registerName('alloc')
  , init = b.sel_registerName('init')
  , description = b.sel_registerName('description')
  , UTF8String = b.sel_registerName('UTF8String')
  , addObject = b.sel_registerName('addObject:')
  , objectsPassingTest = b.sel_registerName('objectsPassingTest:')

var msgSend = b.get_objc_msgSend([ '@', [ '@', ':' ] ])
  , msgSend2 = b.get_objc_msgSend([ 'r*', [ '@', ':' ] ])
  , msgSend3 = b.get_objc_msgSend([ 'v', [ '@', ':', '^' ] ])
  , msgSend4 = b.get_objc_msgSend([ 'v', [ '@', ':', '@' ] ])

var pool = msgSend(msgSend(NSAutoreleasePool, alloc), init)

var set = msgSend(msgSend(NSMutableSet, alloc), init)

msgSend4(set, addObject, NSMutableSet)
//console.log(msgSend2(msgSend(set, description), UTF8String))



// We have to simulate what the llvm compiler does when it encounters a Block
// literal expression:
var __block_literal_1 = b.Struct([
    ['pointer', 'isa']
  , ['int32', 'flags']
  , ['int32', 'reserved']
  , ['pointer', 'invoke']
  , ['pointer', 'descriptor']
])
//console.log(__block_literal_1.__structInfo__)
//console.log('sizeof __block_literal_1: %d', __block_literal_1.__structInfo__.size)

var __block_descriptor_1 = b.Struct([
    ['ulonglong', 'reserved']
  , ['ulonglong', 'Block_size']
])
//console.log('sizeof __block_descriptor_1: %d', __block_descriptor_1.__structInfo__.size)

// Enumerate using a block.
var gotCallback = false
var blockFunc = new b.Callback([ 'int8', [ 'pointer', 'pointer', 'pointer' ]], function (block, obj, stopPtr) {
  //console.error('inside block!')
  //console.error("Enumerate: %d!", index)
  gotCallback = true
})

var invokePtr = blockFunc.getPointer()
  , bl = new __block_literal_1
  , bd = new __block_descriptor_1

// static
bd.reserved = 0
bd.Block_size = __block_literal_1.__structInfo__.size

bl.isa = b.dlopen().get('_NSConcreteGlobalBlock')
//console.log('isa:', bl.isa)
bl.flags = (1<<29)
//console.log('flags:', bl.flags)
bl.reserved = 0
//console.log('reserved:', bl.reserved)
bl.invoke = invokePtr
//console.log('invoke:', bl.invoke)
bl.descriptor = bd.pointer
//console.log('descriptor:', bl.descriptor)


//console.log(bl.pointer)
//console.error(msgSend2(msgSend(bl.pointer, description), UTF8String))

msgSend3(set, objectsPassingTest, bl.pointer)

process.on('exit', function () {
  assert.ok(gotCallback)
})
