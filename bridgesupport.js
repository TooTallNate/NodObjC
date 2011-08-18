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


/**
 * Architecture-specific function that returns the Obj-C type from one of
 * these BridgeSupport XML nodes.
 */
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
        break;
      case 'cftype':
        break;
      case 'constant':
        (function (name, type) {
          _global.__defineGetter__(name, function () {
            var ptr = fw.lib.get(name);
            // TODO: I'm like 99% sure I need to deref the pointer before
            //       wrapping, but I haven't tested yet...
            delete _global[name];
            return _global[name] = core.wrapValue(ptr, type);
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
            // TODO: Handle 'variadic' arg functions (NSLog), will require
            //       a "function generator" to get a Function from the passed
            //       in args (and guess at the types that were passed in...)
            var f = core.Function(curName, types.map(curRtnType), curArgTypes.map(types.map), false, isInline ? fw.inline : fw.lib);
            delete _global[curName];
            // The unwrapper function unwraps passed in arguments,
            // and wraps up the result if necessary.
            function unwrapper () {
              var args = core.unwrapValues(arguments, curArgTypes)
                , rtn = f.apply(null, args)
              return core.wrapValue(rtn, curRtnType)
            }
            // attach the rtn and arg types to the result Function, nice in the REPL
            unwrapper.func = curName;
            unwrapper.rtn = curRtnType;
            unwrapper.args = curArgTypes;
            unwrapper.inline = isInline;
            unwrapper.pointer = f.pointer;
            return _global[curName] = unwrapper;
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
module.exports = bridgesupport;
