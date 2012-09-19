
/**
 * This module takes care of loading the BridgeSupport XML files for a given
 * framework, and parsing the data into the given framework object.
 *
 * ### References:
 *
 *  * [`man 5 BridgeSupport`](http://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/BridgeSupport.5.html)
 *  * [BridgeSupport MacOS Forge website](http://bridgesupport.macosforge.org)
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

var debug = require('debug')('NodObjC:bridgesupport')
  , read = require('fs').readFileSync
  , libxmljs = require('libxmljs')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , IMP = require('./imp')
  , core = require('./core')
  , types = require('./types')
  , struct = require('./struct')
  , _global = require('./global')
  , Import = require('./import').import
  , join = path.join
  , exists = fs.existsSync || path.existsSync
  , DY_SUFFIX = '.dylib'
  , BS_SUFFIX = '.bridgesupport'


/*!
 * Architecture-specific functions that return the Obj-C type or value from one
 * of these BridgeSupport XML nodes.
 */

var getType
  , getValue
if (process.arch == 'x64') {
  // 64-bit specific functions
  debug('using 64-bit "type" and "value" attributes')
  getType = function (node) {
    var v = node.attr('type64') || node.attr('type')
    return v.value()
  }
  getValue = function (node) {
    var v = node.attr('value64') || node.attr('value')
    return v.value()
  }
} else {
  // 32-bit / ARM specific functions
  debug('using regular "type" and "value" attributes')
  getType = function (node) {
    var v = node.attr('type') || node.attr('type64')
    return v.value()
  }
  getValue = function (node) {
    var v = node.attr('value') || node.attr('value64')
    return v.value()
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

  var contents = read(bridgeSupportXML, 'utf8')
    , doc = libxmljs.parseXmlString(contents)
    , nodes = doc.childNodes()

  nodes.forEach(function (node) {
    var name = node.name()
    node._name = name
    //console.error(0, name, node)
    switch (name) {
      case 'text':
        // ignore; just '\n' whitespace
        break;
      case 'depends_on':
        Import(node.attr('path').value(), true)
        break;
      case 'class':
        node.name = node.attr('name').value()
        exports.classes[node.name] = node
        break;
      case 'string_constant':
        _global[node.attr('name').value()] = getValue(node)
        break;
      case 'enum':
        var ignore = node.attr('ignore')
        if (ignore && ignore.value() == 'true') {
          debug('ignoring node since "ignore=true"', node.toString())
        } else {
          _global[node.attr('name').value()] = Number(getValue(node))
        }
        break;
      case 'struct':
        // TODO: Remove the try/catch when all the Struct formats are supported
        //       Still need Array and Union support.
        try {
          _global[node.attr('name').value()] = struct.getStruct(getType(node))
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
        node.name = node.attr('name').value()
        defineConstant(node, fw)
        break;
      case 'function':
        node.name = node.attr('name').value()
        defineFunction(node, fw)
        break;
      case 'opaque':
        break;
      case 'informal_protocol':
        node.name = node.attr('name').value()
        exports.informal_protocols[node.name] = node
        break;
      case 'function_alias':
        break;
      default:
        throw new Error('unkown tag: '+ node.name)
        break;
    }
  })

}


/**
 * Sets up a <constant> tag onto the global exports.
 * These start out as simple JS getters, so that the underlying
 * symbol pointer can be lazy-loaded on-demand.
 */

function defineConstant (node, fw) {
  var name = node.name
    , type = getType(node)
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

function defineFunction (node, fw) {
  var name = node.name
  _global.__defineGetter__(name, function () {
    //console.error(require('util').inspect(a, true, 10))
    // TODO: Handle 'variadic' arg functions (NSLog), will require
    //       a "function generator" to get a Function from the passed
    //       in args (and guess at the types that were passed in...)
    debug('loading function pointer for:', name)
    var isInline = node.attr('inline')
    if (isInline && isInline.value() === 'true') {
      debug('function "%s" is declared as an inline function pointer:', name)
      assert.ok(fw.inline, name+', '+fw.name+': declared inline but could not find inline dylib!')
    }
    node.args = []
    node.childNodes().forEach(function (n, i) {
      var type = n.name()
      //console.error(i, type, n.toString())
      switch (type) {
        case 'arg':
          node.args.push(flattenNode(n))
          break;
        case 'retval':
          node.retval = flattenNode(n)
          break;
        default:
          break;
      }
    })
    //console.error(node)
    var ptr = (isInline ? fw.inline : fw.lib).get(name)
      , unwrapper = IMP.createUnwrapperFunction(ptr, node)
    unwrapper.info = node
    delete _global[name]
    return _global[name] = unwrapper
  })
}

function flattenNode (node) {
  node.type = getType(node)
  var functionPointer = node.attr('function_pointer')
  if (functionPointer && functionPointer.value() === 'true') {
    node.function_pointer = 'true' // XXX: Remove? Used by the function_pointer test case
    node.args = []
    node.childNodes().forEach(function (n, i) {
      var type = n.name()
      switch (type) {
        case 'arg':
          node.args.push(flattenNode(n))
          break;
        case 'retval':
          node.retval = flattenNode(n)
          break;
        default:
          break;
      }
    })
  }
  return node
}
