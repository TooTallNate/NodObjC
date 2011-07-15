/**
 * This module takes care of parsing the BridgeSupport XML files into a JS
 * object.
 */

var sax = require('sax')
  , fs = require('fs')
  , Class = require('./Class')
  , importCache = {}

module.exports = function import (path) {
  if (path in importCache) return importCache[path];

  var contents = fs.readFileSync(path, 'utf8')
    , parser = sax.parser(true)
    , framework = {}
    , gotEnd = false
    , currentClass
    , currentMethod

  parser.onerror = throwErr;
  parser.onopentag = function (node) {
    switch (node.name) {
      case 'depends_on':
        //import(resolve(node.attributes.path));
        break;
      case 'class':
        currentClass = Class.getClass(node.attributes.name);
        if (!currentClass) {
          currentClass = Class.registerClass(node.attributes.name);
          framework[node.attributes.name] = currentClass;
        }
        break;
      case 'method':
        currentMethod = {
            selector: node.attributes.selector
          , args: []
        };
        if (node.attributes.class_method) {
          currentClass[currentMethod.selector] = currentMethod;
        } else {
          currentClass.prototype[currentMethod.selector] = currentMethod;
        }
        break;
      case 'arg':
        currentMethod.args.push(node.attributes);
        break;
      case 'retval':
        currentMethod.retval = node.attributes;
        break;
      case 'signatures':
        // ignore
        break;
      default:
        throw new Error('unkown tag:'+ node.name);
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
  return framework;
}


function throwErr (e) { throw(e); }

