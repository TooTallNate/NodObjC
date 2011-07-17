/**
 * Wraps up Objective-C 'Classes'.
 * There can only be 1 instance of a given class (i.e. no naming collisions,
 * this is C we're dealing with here), so this module keeps a cache of the
 * created classes for when they are re-requested.
 *
 * Now also houses the 'wrapId' stuff. So this file should be renamed at some
 * point.
 */

var classCache = {}
  , core = require('./core')
  , getClass = core.objc_getClass
  , getName = core.class_getName
  , getSuperclass = core.class_getSuperclass
  , getInstanceClass = core.object_getClass

// Gets a Class from the cache by name, if the cache has not been loaded
// prevously though 'registerClass()' then this returns undefined.
exports.getClass = function getClass (name) {
  return classCache[name];
}

// Register a Class globally. Classes are unique by name so this function
// should only be called once per class.
exports.registerClass = function registerName (name) {
  // get a pointer to the native Class
  var ptr = getClass(name)
  // wrap the Class pointer up as a nice JS object
  var wrap = exports.wrapId(ptr)
  wrap.__proto__ = {};
  // add a reference to the name of the class
  wrap.className = name;
  // cache and return all at once
  return classCache[name] = wrap;
}

// Calls the C 'class_getSuperclass' function on the given class reference in
// order to determine it's superclass. It's name is then retrieved and then
// a reference to the appropriate superclass is setup on the original class.
exports.setupInheritance = function setupInheritance (clazz) {
  var superclass = getSuperclass(clazz._ptr)
  if (!superclass.isNull()) {
    var name = getName(superclass)
      , superRef = exports.getClass(name);
    if (!superRef) {
      // I don' think this should ever happen but just in case...
      superRef = exports.registerClass(name);
    }
    clazz.__proto__.__proto__ = superRef;
    clazz.prototype.__proto__ = superRef.prototype;
  }
}


// Wraps up a node-ffi 'pointer' instance to a JS object. The pointer must be
// an 'id' (must be able to do ObjC message passing) or a subclass.
exports.wrapId = function (ptr) {

  // This named function is the wrapped JS object itself. The function
  // reference is passed around to the user, and the function itself should be
  // invoked in order to do Objective-C style "message passing".
  function objc_id (selector) {
    if (!selector) throw new Error("A 'selector' argument is required!");

    var sel = selector
      , noArgs = typeof selector == 'string'
      , keys

    if (!noArgs) {
      // selector with one or more arguments
      keys = Object.keys(selector);
      sel = keys.join(':')+':';
    }
    // TODO: cache SEL references
    var selRef = core.sel_registerName(sel)
      , args = [ objc_id._ptr, selRef ]
      // TODO: add logic for when an unknown selector is passed. All arguments
      //       and the return value should be assumed to be 'id' in that case.
      , method = objc_id.__proto__[sel]
      , msgSend = core.get_objc_msgSend(method)
    if (!noArgs) {
      method.args.forEach(function (arg, i) {
        // TODO: Unwrap any wrapped up ObjC objects
        // TODO: Wrap up regular JS objects so they can be passed to ObjC
        var val = keys[i];
        if (core.objcToFfi(arg) == 'pointer') {
          console.warn("INFO: Arg %d: Unwrapping ObjC instance", i);
          val = selector[val]._ptr;
        } else if (arg.declared_type == 'BOOL') {
          val = selector[val] ? 1 : 0;
        } else {
          // Pass the given argument as-is
          console.warn('INFO: Arg %d: Passing arg as-is', i);
          val = selector[val];
        }
        args.push(val);
      });
    }
    // Send the damn message already!!!
    var rtn = msgSend.apply(null, args);

    // Now inspect the result and (un)wrap or do nothing appropriately
    if (core.objcToFfi(method.retval) == 'pointer') {
      rtn = exports.wrapId(rtn);
      if (sel == 'alloc') {
        // 'alloc' inherits from the Class' prototype
        rtn.__proto__ = objc_id.prototype;
      } else if (/^init/.test(sel)) {
        // a selector that begins with 'init' inherits from the current type
        rtn.__proto__ = objc_id.__proto__;
      } else if (!/^id/.test(method.retval.declared_type)) {
        // If we got here then it's assumed to be a regular ObjC type returned
        // (i.e. 'NSString*'). So we need to extract the pointer symbol and get
        // the declared class reference
        var c = exports.getClass(method.retval.declared_type.replace('*',''));
        if (c) {
          rtn.__proto__ = c.prototype;
        } else {
          console.warn('WARN: could not get Class for return val: %s', method.retval.declared_type);
        }
      } else {
        // Finally, if we got here, then we can retroactively try to get the
        // class reference by calling the 'object_getClassName' function.
        console.warn('WARN: retroactively getting class name (slow-case)');
        var cn = getInstanceClass(rtn._ptr)
          , cname = getName(cn)
          , c = exports.getClass(cname)
        if (c) {
          rtn.__proto__ = c.prototype;
        } else {
          console.warn('WARN: could not get Class for retroactively retrieved class name: %s', cname);
          console.warn('WARN: checking superclass');
          cn = getSuperclass(cn);
          c = exports.getClass(getName(cn));
          if (c) {
            console.warn('WARN: Found superclass: %s', c.className);
            rtn.__proto__ = c.prototype;
          } else {
            console.warn('WARN: assuming it is of type: %s', objc_id.className);
            rtn.__proto__ = objc_id.prototype;
          }
        }
      }
    } else if (method.retval.declared_type == 'BOOL') {
      rtn = !!rtn;
    }
    //console.error(rtn);
    return rtn;
  }
  objc_id._ptr = ptr;
  return objc_id;
}
