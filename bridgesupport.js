/**
 * This module takes care of loading the BridgeSupport XML files for a given
 * framework, and parsing the data into the given framework object.
 *
 * Reference:
 *   http://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/BridgeSupport.5.html
 */

module.exports = bridgesupport;
var fs = require('fs')
  , sax = require('sax')
  , path = require('path')
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
  getType = function (node) {
    var a = node.attributes
    return a.type64 || a.type
  }
  getValue = function (node) {
    var a = node.attributes
    return a.value64 || a.value
  }
} else {
  // 32-bit / ARM specific functions
  getType = function (node) {
    return node.attributes.type
  }
  getValue = function (node) {
    return node.attributes.value
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

  // If there's no BridgeSupport file, then just return...
  if (!exists(bridgeSupportXML)) {
    //console.warn('No BridgeSupport files found for framework "%s" at: %s', fw.name, bridgeSupportXML);
    return;
  }

  if (exists(bridgeSupportDylib)) {
    fw.inline = core.dlopen(bridgeSupportDylib);
  }

  var contents = fs.readFileSync(bridgeSupportXML, 'utf8')
    , parser = sax.parser(true)
    , gotEnd = false
    // For processing C functions
    , curName
    , curRtnType
    , curArgTypes
    , isInline

  parser.onerror = function (e) { throw e; }
  parser.onopentag = function (node) {
    switch (node.name) {
      case 'depends_on':
        Import(node.attributes.path, true)
        break;
      case 'class':
        break;
      case 'method':
        break;
      case 'arg':
        if (curName) {
          // class methods also have args, we only want functions though
          curArgTypes.push(getType(node));
        }
        break;
      case 'retval':
        if (curName) {
          // class methods also have retvals, we only want functions though
          curRtnType = getType(node);
        }
        break;
      case 'signatures':
        break;
      case 'string_constant':
        _global[node.attributes.name] = getValue(node);
        break;
      case 'enum':
        _global[node.attributes.name] = Number(getValue(node));
        break;
      case 'struct':
        try {
          _global[node.attributes.name] = struct.getStruct(getType(node));
        } catch (e) {
          //console.error('FAILED:\n', node)
          //console.error(e.stack)
        }
        break;
      case 'field':
        break;
      case 'cftype':
        break;
      case 'constant':
        (function (name, type) {
          _global.__defineGetter__(name, function () {
            var ptr = fw.lib.get(name) // TODO: Cache the pointer after the 1st call
            ptr._type = '^' + type
            var val = ptr.deref()
            return val
          });
        })(node.attributes.name, getType(node));
        break;
      case 'function':
        curName = node.attributes.name;
        curRtnType = 'v';
        curArgTypes = [];
        isInline = node.attributes.inline == 'true';
        // TODO: is variadic? will require a 'function generator'
        break;
      case 'opaque':
        break;
      case 'informal_protocol':
        break;
      case 'function_alias':
        break;
      default:
        throw new Error('unkown tag: '+ node.name);
        break;
    }
  };
  parser.onclosetag = function (node) {
    switch (node) {
      case 'function':
        // Binded functions will be lazy-loaded. We simply define a getter that
        // does the creation magic the first time, and replaces the getter with
        // the binded function
        (function (curName, curRtnType, curArgTypes, isInline) {
          if (isInline && !fw.inline) throw new Error('declared inline but could not find inline dylib!');
          _global.__defineGetter__(curName, function () {
            // TODO: Handle 'variadic' arg functions (NSLog), will require
            //       a "function generator" to get a Function from the passed
            //       in args (and guess at the types that were passed in...)
            var ptr = (isInline ? fw.inline : fw.lib).get(curName)
              , unwrapper = IMP.createUnwrapperFunction(ptr, [ curRtnType, curArgTypes ])
            unwrapper.func = curName
            unwrapper.inline = isInline
            delete _global[curName]
            return _global[curName] = unwrapper
          });
        })(curName, curRtnType, curArgTypes, isInline);
        curName = null;
        break;
    }
  };
  parser.onend = function () {
    gotEnd = true;
  };

  // Parse the contents of the file. This should happen synchronously.
  parser.write(contents).close();

  if (!gotEnd) throw new Error('could not parse BridgeSupport files synchronously');
}
