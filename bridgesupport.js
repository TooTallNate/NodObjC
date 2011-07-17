/**
 * This module takes care of parsing the BridgeSupport XML files into a JS
 * object.
 */

var fs = require('fs')
  , sax = require('sax')
  , path = require('path')
  , Class = require('./Class')
  , DynamicLibrary = require('node-ffi').DynamicLibrary
  , join = path.join
  , basename = path.basename
  , exists = path.existsSync
  , importCache = {}

exports.PATH = ['/System/Library/Frameworks', '/System/Library/PrivateFrameworks'];
exports.SUFFIX = '.framework';

// Resolve a Framework String into an absolute path. The returned path is the
// base directory of the Framework (i.e. the directory ending with '.framework')
exports.resolve = function resolve (framework) {
  if (~framework.indexOf('/')) {
    return framework;
  }

  var i = 0
    , l = exports.PATH.length
    , rtn

  for (; i<l; i++) {
    rtn = join(exports.PATH[i], framework + exports.SUFFIX);
    if (exists(rtn)) return rtn;
  }
  throw new Error('Could not resolve framework: '+framework);
}

// Import a Framework based on the given name. This can be a short name (i.e.
// "Foundation") or an absolute path to the base dir of the framework (i.e. the
// result of .resolve() )
exports.import = function import (path) {
  //console.error('BEFORE:', path);
  path = exports.resolve(path);
  //console.error('AFTER:', path);

  // return from cache if this framework has already been loaded
  if (path in importCache) {
    //console.error('CACHED!');
    return importCache[path];
  }

  var shortName = basename(path, exports.SUFFIX)
    , binaryPath = join(path, shortName)

  // ensure the binary for the framework is dynamically loaded
  new DynamicLibrary(binaryPath);

  var bridgeSupportPath = join(path, 'Resources', 'BridgeSupport', shortName + 'Full.bridgesupport')
    , hasBridgeSupport = exists(bridgeSupportPath)
    , framework = {}

  // cache the framework representation
  importCache[path] = framework;

  // If there's no BridgeSupport file, then just return the empty object...
  if (!hasBridgeSupport) {
    //console.warn('No BridgeSupport files found for framework "%s"', shortName);
    return framework;
  }

  var contents = fs.readFileSync(bridgeSupportPath, 'utf8')
    , parser = sax.parser(true)
    , gotEnd = false
    , classes = []
    , currentClass
    , currentMethod

  parser.onerror = throwErr;
  parser.onopentag = function (node) {
    switch (node.name) {
      case 'depends_on':
        import(node.attributes.path);
        break;
      case 'class':
        currentClass = Class.getClass(node.attributes.name);
        if (!currentClass) {
          currentClass = Class.registerClass(node.attributes.name);
          framework[node.attributes.name] = currentClass;
          classes.push(currentClass);
        }
        break;
      case 'method':
        currentMethod = {
            selector: node.attributes.selector
          , args: []
        };
        if (node.attributes.class_method) {
          currentClass.__proto__[currentMethod.selector] = currentMethod;
        } else {
          currentClass.prototype[currentMethod.selector] = currentMethod;
        }
        break;
      case 'arg':
        // TODO: currentFunction
        if (currentMethod) {
          currentMethod.args.push(node.attributes);
        }
        break;
      case 'retval':
        // TODO: currentFunction
        if (currentMethod) {
          currentMethod.retval = node.attributes;
        }
        break;
      case 'signatures':
        // ignore
        break;
      case 'string_constant':
        framework[node.attributes.name] = node.attributes.value;
        break;
      case 'struct':
      case 'field':
      case 'cftype':
      case 'constant':
      case 'enum':
      case 'function':
      case 'args':
      case 'opaque':
      case 'informal_protocol':
      case 'function_alias':
        // TODO
        break;
      default:
        throw new Error('unkown tag: '+ node.name);
        break;
    }
  };
  parser.onclosetag = function (node) {
  };
  parser.onend = function () {
    gotEnd = true;
  };

  // Parse the contents of the file. This should happen synchronously.
  parser.write(contents).close();

  if (!gotEnd) {
    throw new Error('could not parse BridgeSupport files synchronously');
  }


  // Now time to set up the inheritance on all the Classes.
  // This has to happen after parsing has completed to ensure that all the
  // required parent classes have been parsed and loaded.
  classes.forEach(function (c) {
    Class.setupInheritance(c);
  });

  return framework;
}


function throwErr (e) { throw(e); }

