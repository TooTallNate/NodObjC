var Struct = require('./core').Struct
  , structs = {}
  , test = /^\{.*?\}$/

/**
 * Tests if the given arg is a Struct constructor or a string type describing
 * a struct (then true), otherwise false.
 */
exports.isStruct = function isStruct (type) {
  return !!type.__isStructType__ || test.test(type)
}

/**
 * Returns the struct constructor function for the given struct name or type.
 */
exports.getStruct = function getStruct (type) {
  // First check if a regular name was passed in
  var rtn = structs[type];
  if (rtn) return rtn;
  // Next parse the type structure
  var parsed = exports.parseStruct(type);
  // If the struct type name has already been created, return that one
  rtn = structs[parsed.name];
  if (rtn) return rtn;
  // Otherwise we need to create a new Struct constructor
  var props = [];
  parsed.props.forEach(function (prop) {
    props.push([ exports._typeMap(prop.type), prop.name ])
  })
  return rtn[props.name] = Struct(props)
}

/**
 * Parses a struct type string into an Object with a `name` String and
 * a `props` Array (entries are a type string, or another parsed struct object)
 */
exports.parseStruct = function parseStruct (struct) {
  var s = struct.substring(1, struct.length-1)
    , equalIndex = s.indexOf('=')
    , rtn = {
        name: s.substring(0, equalIndex)
      , props: []
    }
  s = s.substring(equalIndex+1)
  var curProp = null
    , hasBracket = false
    , entries = []
  addProp()
  for (var i=0; i < s.length; i++) {
    var cur = s[i]
    switch (cur) {
      case '"':
        if (hasBracket)
          curProp.push(cur)
        else
          addProp()
        break;
      case '{':
        hasBracket = true
        curProp.push(cur)
        break;
      case '}':
        hasBracket = false
        curProp.push(cur)
        break;
      default:
        curProp.push(cur)
        break;
    }
  }
  addProp()
  function addProp () {
    if (curProp)
      entries.push(curProp.join(''))
    curProp = []
    hasBracket = false
  }
  for (var i=1; i < entries.length; i+=2) {
    rtn.props.push([entries[i], entries[i+1]])
  }
  return rtn
}
