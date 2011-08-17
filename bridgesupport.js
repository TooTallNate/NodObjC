/**
 * This module takes care of loading the BridgeSupport XML files for a given
 * framework, and parsing the data into the given framework object.
 */

var fs = require('fs')
  , sax = require('sax')
  , path = require('path')
  , core = require('./core')
  , types = require('./types')
  , join = path.join
  , basename = path.basename
  , exists = path.existsSync
  , DY_SUFFIX = '.dylib'
  , BS_SUFFIX = '.bridgesupport'


var getType;
if (process.arch == 'x64')
  getType = function (node) {
    var a = node.attributes;
    return a.type64 || a.type;
  }
else
  getType = function (node) {
    return node.attributes.type;
  }

/**
 * Attempts to retrieve the BridgeSupport files for the given framework.
 * It synchronously reads the contents of the bridgesupport files and parses
 * them in order to add the symbols that the Obj-C runtime functions cannot
 * determine.
 */
function bridgesupport (fw, _global) {

  var bridgeSupportDir = join(fw.basePath, 'Resources', 'BridgeSupport')
    , bridgeSupportXML = join(bridgeSupportDir, fw.name + BS_SUFFIX)
    , bridgeSupportDylib = join(bridgeSupportDir, fw.name + DY_SUFFIX)

  // If there's no BridgeSupport file, then just return the empty object...
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
    //console.error(node);
    switch (node.name) {
      case 'depends_on':
        bridgesupport.import(node.attributes.path);
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
        // ignore
        break;
      case 'string_constant':
        _global[node.attributes.name] = node.attributes.value;
        break;
      case 'enum':
        _global[node.attributes.name] = parseInt(node.attributes.value);
        break;
      case 'struct':
        break;
      case 'field':
        //console.error(node);
        break;
      case 'cftype':
        break;
      case 'constant':
        try {
          var ptr = fw.lib.get(node.attributes.name);
          // TODO: I'm like 99% sure I need to deref the pointer before wrapping,
          //       but I haven't tested yet...
          _global[node.attributes.name] = core.wrapValue(ptr, node.attributes.type);
        } catch (e) {
          //console.error(e);
          //console.error(node);
        }
        break;
      case 'function':
        curName = node.attributes.name;
        curRtnType = null;
        curArgTypes = [];
        isInline = node.attributes.inline == 'true';
        // TODO: is variadic? will require a 'function generator'
        break;
      case 'args':
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
            var f = core.Function(curName, curRtnType, curArgTypes, false, isInline ? fw.inline : fw.lib);
            delete _global[curName];
            return _global[curName] = f;
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

  if (!gotEnd) {
    throw new Error('could not parse BridgeSupport files synchronously');
  }
}
module.exports = bridgesupport;
