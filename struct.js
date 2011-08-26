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
exports.parseStruct = function parseStruct (type) {
  var rtn = null
    , cur = null
    , curProp = null
    , par = null
    , name = null
    , l = type.length
  for (var i=0; i<l; i++) {
    var c = type[i]
    switch (c) {
      case '{': // beginning of new struct, set to cur
        cur = { props: [] }
        name = []
        curProp = null
        if (!rtn) rtn = cur // this is the outer struct
        else par = rtn
        break;
      case '}': // end of cur struct
        endOfProp();
        if (par && cur !== par) {
          var prop = par.props[par.props.length-1]
          prop && (prop.val = cur)
        }
        cur = par
        break;
      case '"': // begin/end of prop name
        if (!curProp) {
          //console.error('creating new Prop')
          curProp = {}
          cur.props.push(curProp)
        }
        endOfProp()
        name = []
        break;
      case '=': // end of cur name
        cur.name = getName()
        //console.error('got struct name: %s', cur.name)
        break;
      default:
        name.push(c)
        break;
    }
  }

  function endOfProp () {
    if (name) { // end
      var str = getName()
      //console.error('endOfProp: %s', str)
      if (curProp.name) {
        //console.error('  setting prop val')
        setVal(str)
      } else {
        //console.error('  setting prop name')
        curProp.name = str
      }
    }
  }
  function setVal (val) {
    //console.error('setVal: %j', val);
    curProp.val = val
    curProp = null
  }
  function getName () {
    var rtn = name.join('')
    name = null
    return rtn
  }
  return rtn
}
