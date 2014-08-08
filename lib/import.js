module.exports = (function() {
  /**
   * Logic for importing a Framework into the node process.
   *
   * "Importing" a framework is a multi-step process:
   *
   *   1. `resolve()` the absolute path of the given framework name.
   *   1. Load the framework's binary `dylib` file into the process.
   *   1. Usually locate the `BridgeSupport` files for the framework and process.
   *   1. Define any new class getters for newly loaded Objective-C classes.
   */

  /*!
   * Module exports.
   */
  var ex = {};

  /*!
   * Module dependencies.
   */
  var fs = require('fs')
    , read = require('fs').readFileSync
    , assert = require('assert')
    , path = require('path')
    , core = require('./core')
    , Class = require('./class')
    , ID = require('./ID')
    , join = path.join
    , basename = path.basename
    , exists = fs.existsSync || path.existsSync
    , SUFFIX = '.framework'
    , PATH = [
        '/System/Library/Frameworks'
      , '/System/Library/PrivateFrameworks'
    ]
    , join = path.join
    , exists = fs.existsSync || path.existsSync
    , DY_SUFFIX = '.dylib'
    , BS_SUFFIX = '.bridgesupport';

  /*!
   * A cache for the frameworks that have already been imported.
   */

  var cache = {}

  /*!
   * Architecture-specific functions that return the Obj-C type or value from one
   * of these BridgeSupport XML nodes.
   */

  var typePrefix = (process.arch=='x64') ? '64' : '';
  var typeSuffix = (process.arch=='x64') ? '' : '64';

  function getType(node) {
    return node.attrib['type'+typePrefix] || node.attrib['type'+typeSuffix];
  }

  function getValue(node) {
    return node.attrib['value'+typePrefix] || node.attrib['value'+typeSuffix];
  }

  function fastIndexOf(subject, target, fromIndex) {
    var length = subject.length, i = 0;
    if (typeof fromIndex === 'number') {
      i = fromIndex;
      if (i < 0) {
        i += length;
        if (i < 0) i = 0;
      }
    }
    for (; i < length; i++) {
      if (subject[i] === target) return i;
    }
    return -1;
  }

  function parseAttrib(tag,attr) {
    var coll = {}, split = 0, name = '', value = '', i=0;
    attr = attr.split('\' ');
    for(; i < attr.length; i++) 
    {
      split = fastIndexOf(attr[i],"=");
      name = attr[i].substring(0,split);
      value = attr[i].substring(split+2, (i==attr.length-1) ? attr[i].length-1 : undefined);
      if(fastIndexOf(value,'&') != -1) value = value.replace(quoteRegExp, '"')
      coll[name]=value;
    }
    return coll;
  }

  function parseTag(names, tag, content) {
    var sattr = 2+tag.name.length
        , eattr = fastIndexOf(content,'>',1)
        , isBodyless = (content[eattr-1]=='/');
    
    var sbody = eattr+1
      , ebody = isBodyless ? eattr-1 : content.indexOf('</'+tag.name, eattr); // cannot use fastIndexOf
    
    tag.end = isBodyless ? ebody + 2 : ebody + tag.name.length + 3;
    tag.attrib = parseAttrib(tag,content.substring(sattr,eattr + (isBodyless ? -1 : 0)));
    if(sbody == ebody || names[tag.name] == null) tag.children = [];
    else tag.children = findTags(names[tag.name], content.substring(sbody,ebody));
    return tag;
  }

  function findTags(names, content) {
    var ndx = 0, i = 0, tagKeys = Object.keys(names), ftags=[{end:1}], key = '';

    do {
      content = content.substring(ndx);
      for(i=0; i < tagKeys.length; i++) {
        key = tagKeys[i];
        // quick break for non-matching keys, cheaper on fails (which happen a lot)
        // rather than a full substring. Three is both the max benefit and after that
        // we'll cause some odd behavior (e.g., matching conditions)
        if( content[1] == key[0] && 
            content[2] == key[1] && 
            content[3] == key[2]) 
        {
          if(key.length < 4 || key == content.substring(1,key.length+1)) {
            delete ftags[ftags.length-1].end;
            ftags.push(parseTag(names,{name:key},content));
            break;
          }
        }
      }
      ndx = fastIndexOf(content, '<', ftags[ftags.length-1].end );
    } while(ndx != -1);

    ftags.shift();
    
    return ftags;
  }
  var quoteRegExp = new RegExp("&quot;","g");

  /**
   * This module takes care of loading the BridgeSupport XML files for a given
   * framework, and parsing the data into the given framework object.
   *
   * ### References:
   *
   *  * [`man 5 BridgeSupport`](http://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/BridgeSupport.5.html)
   *  * [BridgeSupport MacOS Forge website](http://bridgesupport.macosforge.org)
   */

  /**
   * Attempts to retrieve the BridgeSupport files for the given framework.
   * It synchronously reads the contents of the bridgesupport files and parses
   * them in order to add the symbols that the Obj-C runtime functions cannot
   * determine.
   */
  function parseBridgeFile(fw, onto, recursive) {
    var bridgedir = join(fw.basePath, 'Resources', 'BridgeSupport')
      , bridgeSupportXML = join(bridgedir, fw.name + BS_SUFFIX)
      , bridgeSupportDylib = join(bridgedir, fw.name + DY_SUFFIX);

    // If there's no BridgeSupport file, then bail...
    if (!exists(bridgeSupportXML)) return;

    // Load the "inline" dylib if it exists
    if (exists(bridgeSupportDylib))
      fw.inline = core.dlopen(bridgeSupportDylib);

    var tags = {'function':{'retval':{'retval':null,'arg':null},'arg':{'retval':null,'arg':null}},'depends_on':null,'string_constant':null,'enum':null,'struct':null,'constant':null};
    var nodes = findTags(tags, read(bridgeSupportXML, 'utf8'));

    nodes.forEach(function (node) {
      var name = node.attrib.name;
      switch (node.name) {
        case 'depends_on':
          if(recursive && recursive > 0)
            importFramework(node.attrib.path, true, onto, --recursive);
          break;
        case 'string_constant':
          // Not a lot, 52157752 (or less than 1%)
          onto[name] = getValue(node);
          break;
        case 'enum':
          // ~ 46,448,704 from 52,372,408 or (5,923,704) (11%)
          if (!node.attrib.ignore || node.attrib.ignore != "true") 
            onto[name] = parseInt(getValue(node));
          break;
        case 'struct':
          // ~ 23,511,384 from 52,372,408 or (28,861,024) (55%)
          var type = getType(node);
          core.Types.knownStructs[core.Types.parseStructName(type)] = type;
         break;
        case 'constant':
          var type = getType(node);
          // This may seem strange but it helps us limit the amount of memory
          // so rather than actually loading the constant we only load it when
          // requested.
          // ~ 50,376,040 from 52,372,408 or (1,996,368) (3.8%)
          onto.__defineGetter__(name, function () {
            var ptr = fw.lib.get(name); // TODO: Cache the pointer after the 1st call
            ptr._type = '^' + type;
            return ptr.deref();
          });
          break;
        case 'function':
          if(node.attrib.original) {
            onto[node.attrib.original] = onto[node.attrib.name];
            break;
          }
          var isInline = node.attrib.inline && node.attrib.inline === 'true' ? true : false;
          var isVariadic = node.attrib.variadic && node.attrib.variadic === 'true' ? true : false;
          var passedTypes = {};
          passedTypes.args = [];
          passedTypes.name = name;
          node.children.forEach(function (n, i) {
              var type = n.name;
              switch (type) {
                case 'arg':
                  passedTypes.args.push(flattenNode(n));
                  break;
                case 'retval':
                  passedTypes.retval = flattenNode(n);
                  break;
                default:
                  break;
              }
            });

          // This may seem strange that were redefining our own property on the
          // first execution (or access) of this property, but its due to that
          // the symbol won't exist until we've finished loading the framework
          // so we set it as a proxy, it also may help save a tiny amount of
          // memory and library loads. NOTE: no references to "node" can be in
          // side this function otherwise we'll leak all of the XML data in
          // memory and cause GC issues.
          // ~ 45,793,448 from 52,372,408  or (6,578,960) (12% of the memory use)
          Object.defineProperty(onto, name, {
            get:function() {
              // TODO: Handle 'variadic' arg functions (NSLog), will require
              //       a "function generator" to get a Function from the passed
              //       in args (and guess at the types that were passed in...)
              if (isInline)
                assert.ok(fw.inline, name+', '+fw.name+': declared inline but could not find inline dylib!');
              var ptr = (isInline ? fw.inline : fw.lib).get(name);
              var unwrapper = isVariadic ? core.createUnwrapperFunctionVar(ptr, passedTypes)
                                         : core.createUnwrapperFunction(ptr, passedTypes);
              delete onto[name];
              return onto[name] = unwrapper;
            }
          });
          break;
        default:
          break;
      }
    });
  }

  function flattenNode (node) {
    var rnode = {};
    rnode.type = getType(node);
    var functionPointer = node.attrib.function_pointer;
    if (functionPointer === 'true') {
      rnode.function_pointer = 'true'; // XXX: Remove? Used by the function_pointer test case
      rnode.args = [];
      node.children.forEach(function (n, i) {
        switch (n.name) {
          case 'arg':
            rnode.args.push(flattenNode(n));
            break;
          case 'retval':
            rnode.retval = flattenNode(n);
            break;
          default:
            break;
        }
      })
    }
    return rnode;
  }

  /**
   * Accepts a single framework name and resolves it into an absolute path
   * to the base directory of the framework.
   *
   * In most cases, you will not need to use this function in your code.
   *
   *     $.resolve('Foundation')
   *     //  '/System/Library/Frameworks/Foundation.framework'
   *
   * @param {String} framework The framework name or path to resolve.
   * @return {String} The resolved framework path.
   */
  function resolve (framework) {
    // strip off a trailing slash if present
    if (framework[framework.length-1] == '/')
      framework = framework.slice(0, framework.length-1);
    // already absolute, return as-is
    if (~framework.indexOf('/')) return framework;
    var i=0, l=PATH.length, rtn=null;
    for (; i<l; i++) {
      rtn = join(PATH[i], framework + SUFFIX);
      if (exists(rtn)) return rtn;
    }
    throw new Error('Could not resolve framework: ' + framework);
  }

  /**
   * Allocates a new pointer to this type. The pointer points to `nil` initially.
   * This is meant for creating a pointer to hold an NSError*, and pass a ref()
   * to it into a method that accepts an 'error' double pointer.
   * XXX: Tentative API - name will probably change
   */
  function allocReference(classWrap) {
    // We do some "magic" here to support the dereferenced
    // pointer to become an obj-c type.
    var ptr = core.REF.alloc('pointer', null);
    ptr._type = '@';
    var _ref = ptr.ref;
    ptr.ref = function() {
      var v = _ref.call(ptr,arguments);
      var _deref = v.deref;
      v.deref = function() {
        var rtnval = _deref.call(v,arguments)
        return core.wrapValue(rtnval,'@');
      };
      return v;
    };
    return ptr;
  }

  /**
   * Accepts a single framework name and imports it into the current node process.
   * `framework` may be a relative (singular) framework name, or a path (relative or
   * absolute) to a Framework directory.
   *
   *     $.NSObject   // undefined
   *
   *     $.import('Foundation')
   *
   *     $.NSObject   // [Class: NSObject]
   *
   * @param {String} framework The framework name or path to load.
   */
  function importFramework (framework, skip, onto, recursive) {
    framework=resolve(framework);
    var shortName=basename(framework, SUFFIX);
    // Check if the framework has already been loaded
    var fw=cache[shortName];
    if (fw) return;
    // Load the main framework binary file
    var frameworkPath=join(framework, shortName), lib=core.dlopen(frameworkPath);

    fw={ lib:lib, name:shortName, basePath:framework, binaryPath:frameworkPath };

    // cache before loading bridgesupport files
    cache[shortName] = fw;

    // Parse the BridgeSupport file and inline dylib, for the C functions, enums,
    // and other symbols not introspectable at runtime.
    parseBridgeFile(fw, onto, recursive);

    // Iterate through the loaded classes list and define "setup getters" for them.
    if (!skip) {
      var classes = core.getClassList();
      classes.forEach(function (c) {
        if (c in onto) return;
        // This may seem odd but it helps to create the definition that pulls the
        // object on the first loop rather than load every class/obj into memory
        // that may not be needed.  This is huge savings, difference of 60MB for
        // definitions vs. 500MB.
        onto.__defineGetter__(c, function () {
          var clazz = Class.getClassByName(c, onto);
          delete onto[c];
          return onto[c] = clazz;
        });
      });
    }
  }

  /*!
   * Module exports.
   */
  ex.bridgesupport = parseBridgeFile
  ex.import = importFramework;
  ex.resolve = resolve;
  ex.framework = importFramework;
  ex.PATH = PATH;
  ex.allocReference = allocReference;
  return ex;
})();
