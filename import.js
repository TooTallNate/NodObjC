/**
 * Logic for importing a Framework into the node process.
 */

var fs = require('fs')
  , path = require('path')
  , core = require('./core')
  , bridgesupport = require('./bridgesupport')
  , join = path.join
  , basename = path.basename
  , exists = path.existsSync
  , SUFFIX = '.framework'

// A cache for the frameworks that have already been imported.
var importCache = {};

// The Framework PATH. Equivalent to the -F switch with gcc.
exports.PATH = ['/System/Library/Frameworks', '/System/Library/PrivateFrameworks'];


/**
 * Accepts a single framework name and imports it into the current node process
 */
exports.import = function importFramework (framework) {
  framework = exports.resolve(framework);

  var shortName = basename(framework, SUFFIX)

  // Return from the framework cache if possible
  var fw = importCache[shortName];
  if (fw) {
    return fw;
  }

  // Load the main framework binary file
  var frameworkPath = join(framework, shortName)
    , lib = core.dlopen(frameworkPath)
  fw = {
      lib: lib
    , name: shortName
    , basePath: framework
    , binaryPath: frameworkPath
  };

  // cache before loading bridgesupport files
  importCache[shortName] = fw;

  // Parse the BridgeSupport file and inline dylib, for the C functions, enums,
  // and other symbols not introspectable at runtime.
  bridgesupport(fw, exports);

  return fw;
}
// also attach the import function into bridgesupport, to avoid a circular
// dependency
bridgesupport.import = exports.import;


/**
 * Accepts a single framework name and resolves it into an absolute path
 * to the base directory of the framework.
 */
exports.resolve = function resolve (framework) {
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
