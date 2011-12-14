
/**
 * This module takes care of loading the BridgeSupport XML files for a given
 * framework, and parsing the data into the given framework object.
 *
 * Reference:
 *   http://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/BridgeSupport.5.html
 */

/*!
 * Module exports.
 */

exports.bridgesupport = bridgesupport
exports.classes = {}
exports.informal_protocols = {}

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC')
  , fs = require('fs')
  , sax = require('sax')
  , path = require('path')
  , assert = require('assert')
  , IMP = require('./imp')
  , core = require('./core')
  , types = require('./types')
  , struct = require('./struct')
  , _global = require('./index')
  , Import = require('./import').import
  , join = path.join
  , exists = path.existsSync
  , DY_SUFFIX = '.dylib'
  , BS_SUFFIX = '.bridgesupport'


/**
 * Architecture-specific functions that return the Obj-C type or value from one
 * of these BridgeSupport XML nodes.
 */

var getType
  , getValue
if (process.arch == 'x64') {
  // 64-bit specific functions
  debug('using 64-bit "type" and "value" attributes')
  getType = function (a) {
    return a.type64 || a.type
  }
  getValue = function (a) {
    return a.value64 || a.value
  }
} else {
  // 32-bit / ARM specific functions
  debug('using regular "type" and "value" attributes')
  getType = function (a) {
    return a.type
  }
  getValue = function (a) {
    return a.value
  }
}

/**
 * Attempts to retrieve the BridgeSupport files for the given framework.
 * It synchronously reads the contents of the bridgesupport files and parses
 * them in order to add the symbols that the Obj-C runtime functions cannot
 * determine.
 */

function bridgesupport (fw) {

  var bridgeSupportDir = join(fw.basePath, 'Resources', 'BridgeSupport')
    , bridgeSupportXML = join(bridgeSupportDir, fw.name + BS_SUFFIX)
    , bridgeSupportDylib = join(bridgeSupportDir, fw.name + DY_SUFFIX)

  // If there's no BridgeSupport file, then bail...
  if (!exists(bridgeSupportXML)) {
    debug('no BridgeSupport files found for framework "%s" at:', fw.name, bridgeSupportXML)
    return
  }

  // Load the "inline" dylib if it exists
  if (exists(bridgeSupportDylib)) {
    debug('importing "inline" dylib for framework "%s" at:', fw.name, bridgeSupportDylib)
    fw.inline = core.dlopen(bridgeSupportDylib)
  }

  var contents = fs.readFileSync(bridgeSupportXML, 'utf8')
    , parser = sax.parser(true)
    , gotEnd = false
    , curObj = null

  parser.onerror = function (e) { throw e }
  parser.onopentag = function (node) {
    var a = node.attributes
    //a._name = node.name
    switch (node.name) {
      case 'depends_on':
        Import(a.path, true)
        break;
      case 'class':
        curObj = exports.classes[a.name] || a
        exports.classes[curObj.name] = curObj
        break;
      case 'method':
        // Normalize the 'type' for the platform
        a.type = getType(a)
        a._parent = curObj
        if (!curObj.methods)
          curObj.methods = []
        curObj.methods.push(a)
        curObj = a
        break;
      case 'arg':
        // Normalize the 'type' for the platform
        a.type = getType(a)
        a._parent = curObj
        if (!curObj.args)
          curObj.args = []
        curObj.args.push(a)
        curObj = a
        break;
      case 'retval':
        // Normalize the 'type' for the platform
        a.type = getType(a)
        a._parent = curObj
        curObj.retval = a
        curObj = a
        break;
      case 'signatures':
        break;
      case 'string_constant':
        _global[a.name] = getValue(a)
        break;
      case 'enum':
        _global[a.name] = Number(getValue(a))
        break;
      case 'struct':
        // TODO: Remove the try/catch when all the Struct formats are supported
        //       Still need Array and Union support.
        try {
          _global[a.name] = struct.getStruct(getType(a))
        } catch (e) {
          //console.error('FAILED:\n', a)
          //console.error(e.stack)
        }
        break;
      case 'field':
        break;
      case 'cftype':
        break;
      case 'constant':
        defineConstant(a, fw)
        break;
      case 'function':
        curObj = a
        break;
      case 'opaque':
        break;
      case 'informal_protocol':
        curObj = exports.informal_protocols[a.name] || a
        exports.informal_protocols[curObj.name] = curObj
        break;
      case 'function_alias':
        break;
      default:
        throw new Error('unkown tag: '+ node.name)
        break;
    }
  }
  parser.onclosetag = function (node) {
    switch (node) {
      case 'function':
        // Binded functions will be lazy-loaded. We simply define a getter that
        // does the creation magic the first time, and replaces the getter with
        // the binded function
        defineFunction(curObj, fw)
        curObj = null
        break;
      case 'arg':
      case 'method':
      case 'retval':
        var c = curObj._parent
        curObj._parent = null
        curObj = c
        break;
    }
  }
  parser.onend = function () {
    gotEnd = true
  }

  // Parse the contents of the file. This should happen synchronously.
  parser.write(contents).close()

  assert.ok(gotEnd, 'could not parse BridgeSupport files synchronously')
}


/**
 * Sets up a <constant> tag onto the global exports.
 * These start out as simple JS getters, so that the underlying
 * symbol pointer can be lazy-loaded on-demand.
 */

function defineConstant (a, fw) {
  var name = a.name
    , type = getType(a)
  _global.__defineGetter__(name, function () {
    var ptr = fw.lib.get(name) // TODO: Cache the pointer after the 1st call
    ptr._type = '^' + type
    var val = ptr.deref()
    return val
  })
}


/**
 * Sets up a <function> tag onto the global exports.
 * These start out as simple JS getters, so that the underlying
 * function pointer can be lazy-loaded on-demand.
 */

function defineFunction (a, fw) {
  var name = a.name
    , isInline = a.inline == 'true'
  _global.__defineGetter__(name, function () {
    //console.error(require('util').inspect(a, true, 10))
    // TODO: Handle 'variadic' arg functions (NSLog), will require
    //       a "function generator" to get a Function from the passed
    //       in args (and guess at the types that were passed in...)
    debug('loading function pointer for:', name)
    if (isInline) {
      assert.ok(fw.inline, name+', '+fw.name+': declared inline but could not find inline dylib!')
    }
    var ptr = (isInline ? fw.inline : fw.lib).get(name)
      , unwrapper = IMP.createUnwrapperFunction(ptr, a)
    unwrapper.info = a
    delete _global[name]
    return _global[name] = unwrapper
  })
}
