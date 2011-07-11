var o = require('objc')
  , fs = require('fs')
  , xml2js = require('xml2js')
  , join = require('path').join
  , exists = require('path').existsSync
  , dlopen = o.dlopen
  , objc_getClass = o.objc_getClass

exports.PATH = ['/System/Library/Frameworks', '/System/Library/PrivateFrameworks'];
exports.SUFFIX = '.framework';

exports.resolve = function resolve (framework) {
  var absolute = ~framework.indexOf('/')
    , i = 0
    , l = exports.PATH.length
    , rtn

  if (absolute) {
    return framework;
  }

  for (; i<l; i++) {
    rtn = join(exports.PATH[i], framework + exports.SUFFIX);
    if (exists(rtn)) return rtn;
  }
  throw new Error('Could not resolve framework: '+framework);
}

exports.import = function import (framework) {
  var resolved = exports.resolve(framework)
    , binaryPath = join(resolved, basename(framework))
  //console.error(resolved);
  //console.error(binaryPath);

  // Load the Framework binary into the current process
  dlopen(binaryPath);

  var bridgesupportPath = join(resolved, 'Resources', 'BridgeSupport', basename(framework) + 'Full.bridgesupport')
    , parser = new xml2js.Parser()
    , rtn = {}
    , bridgesupport;
  try {
    var bridgesupportContents = fs.readFileSync(bridgesupportPath, 'utf8')
    parser.on('end', function (obj) { bridgesupport = obj; });
    parser.parseString(bridgesupportContents);
    if (!bridgesupport) throw new Error('xml2js was not synchronous!');
  } catch (e) {}

  if (!bridgesupport) return rtn;

  // First recursively load any other Framework that this one 'depends_on'
  if (bridgesupport['depends_on'] && !Array.isArray(bridgesupport['depends_on']))
    bridgesupport['depends_on'] = [ bridgesupport['depends_on'] ];
  (bridgesupport['depends_on'] || []).forEach(function (d) {
    exports.import(d['@'].path);
  });

  // Specify the version of the Framework
  rtn._version = bridgesupport['@'].version;

  // Create 'Class' instances for each defined class
  if (bridgesupport.class) {
    (bridgesupport.class || []).forEach(function (c) {
      var clz = o.objc_getClass(c['@'].name)
        , obj = {}
      obj.prototype = {};
      obj.name = c['@'].name;

      // Every class gets an 'alloc' class method
      obj.alloc = function () {
        var id = o.objc_msgSend(clz, o.sel_registerName('alloc'))
          , rtn = {}
        rtn.__proto__ = obj.prototype;
        rtn._id = id;
        return rtn;
      }

      // Every instance has an 'init' method
      obj.prototype.init = function () {
        this._id = o.objc_msgSend(this._id, o.sel_registerName('init'));
        return this;
      }

      obj.prototype.toString = function () {
        return this._id.toString.apply(this._id, arguments);
      }
      obj.prototype.inspect = obj.prototype.toString;

      // Set up each of the methods as functions
      if (c.method) {
        if (!Array.isArray(c.method)) c.method = [ c.method ];
        c.method.forEach(function (method) {
          var name = method['@'].selector.replace(/\:/g, '_');
          if (method['@'].class_method) {
            obj[name] = function () {
              var args = [clz, o.sel_registerName(method['@'].selector)];
              args.push.apply(args, arguments);
              return o.objc_msgSend.apply(null, args);
            }
          } else {
            obj.prototype[name] = function () {
              var args = [this._id, o.sel_registerName(method['@'].selector)];
              args.push.apply(args, arguments);
              return o.objc_msgSend.apply(null, args);
            }
          }
        });
      }
      rtn[obj.name] = obj;
    });
  }

  return rtn;
}


function basename (framework) {
  var lastSlash = framework.lastIndexOf('/');
  if (!lastSlash) return framework;
  framework = framework.substring(lastSlash+1);
  if (framework.substring(framework.length - exports.SUFFIX.length) === exports.SUFFIX)
    framework = framework.substring(0, framework.length - exports.SUFFIX.length);
  return framework;
}
