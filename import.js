/**
 * Logic for importing a Framework into the node process.
 */

exports.import = importFramework
exports.resolve = resolve

// The Framework PATH. Equivalent to the -F switch with gcc.
exports.PATH = ['/System/Library/Frameworks', '/System/Library/PrivateFrameworks']

var fs = require('fs')
  , path = require('path')
  , core = require('./core')
  , _class = require('./class')
  , _global = require('./index')
  , bridgesupport = require('./bridgesupport').bridgesupport
  , debug = require('debug')('NodObjC')
  , join = path.join
  , basename = path.basename
  , exists = path.existsSync
  , SUFFIX = '.framework'

// A cache for the frameworks that have already been imported.
var importCache = {}


/**
 * Accepts a single framework name and imports it into the current node process
 */
function importFramework (framework, skip) {
  debug('importing framework:', framework, skip)
  framework = exports.resolve(framework)

  var shortName = basename(framework, SUFFIX)

  // Check if the framework has already been loaded
  var fw = importCache[shortName]
  if (fw) {
    debug('skipping framework because already loaded:', framework)
    return
  }

  // Load the main framework binary file
  var frameworkPath = join(framework, shortName)
    , lib = core.dlopen(frameworkPath)
  fw = {
      lib: lib
    , name: shortName
    , basePath: framework
    , binaryPath: frameworkPath
  }

  // cache before loading bridgesupport files
  importCache[shortName] = fw

  // Parse the BridgeSupport file and inline dylib, for the C functions, enums,
  // and other symbols not introspectable at runtime.
  bridgesupport(fw)

  // Iterate through the loaded classes list and define "setup getters" for them.
  if (!skip) {
    var classes = core.getClassList()
    debug('loading ObjC Classes:', classes.length)
    classes.forEach(function (c) {
      if (c in _global) return
      _global.__defineGetter__(c, function () {
        var clazz = _class.getClass(c)
        delete _global[c]
        return _global[c] = clazz
      })
    })
  }

  debug('finished importing framework:', shortName)
}


/**
 * Accepts a single framework name and resolves it into an absolute path
 * to the base directory of the framework.
 */
function resolve (framework) {
  // already absolute, return as-is
  if (~framework.indexOf('/')) return framework;
  var i = 0
    , l = exports.PATH.length
    , rtn = null
  for (; i<l; i++) {
    rtn = join(exports.PATH[i], framework + SUFFIX);
    if (exists(rtn)) return rtn;
  }
  throw new Error('Could not resolve framework: ' + framework);
}
