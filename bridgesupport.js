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



function bridgesupport (fw, _global) {

  var bridgeSupportDir = join(fw.basePath, 'Resources', 'BridgeSupport')
    , bridgeSupportXML = join(bridgeSupportDir, fw.name + BS_SUFFIX)
    , bridgeSupportDylib = join(bridgeSupportDir, fw.name + DY_SUFFIX)

  // If there's no BridgeSupport file, then just return the empty object...
  if (!exists(bridgeSupportXML)) {
    console.warn('No BridgeSupport files found for framework "%s" at: %s', fw.name, bridgeSupportXML);
    return;
  }

  if (exists(bridgeSupportDylib)) {
    fw.inline = core.dlopen(bridgeSupportDylib);
  }

  var contents = fs.readFileSync(bridgeSupportXML, 'utf8')
    , parser = sax.parser(true)
    , gotEnd = false
    , classes = []
    , constants = []
    , curName
    , curRtnType
    , curArgTypes
    , isInline;
  //console.error(contents);

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
          // TODO: Get 64-bit type
          curArgTypes.push(types.map(node.attributes.type));
        }
        break;
      case 'retval':
        if (curName) {
          // class methods also have retvals, we only want functions though
          // TODO: Get 64-bit type
          curRtnType = types.map(node.attributes.type);
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
        //constants.push(node);
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


  /*
  // Now time to set up the inheritance on all the Classes.
  // This has to happen after parsing has completed to ensure that all the
  // required parent classes have been parsed and loaded.
  classes.forEach(function (c) {
    Class.setupInheritance(c);
  });

  constants.forEach(function (node) {
    var sym = lib.get(node.attributes.name);
    if (node.attributes.declared_type == 'NSString*') {
      sym = Class.wrapId(sym);
      sym.__proto__ = Class.getClass('NSString').prototype;
      framework[node.attributes.name] = sym;
    }
  });
  */
}
module.exports = bridgesupport;
