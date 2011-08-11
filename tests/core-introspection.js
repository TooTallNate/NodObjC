var b = require('../core')
  , ffi = require('node-ffi')
  , className = process.argv[2] || 'NSMutableArray'

var c = b.objc_getClass(className);

if (c.isNull()) {
  console.error('Could not load Class: %s', className);
  process.exit(1);
}

var name = b.class_getName(c);
console.error('class_getName: %s', name);

var numMethods = new ffi.Pointer(ffi.Bindings.TYPE_SIZE_MAP.uint32)
  , methods = b.class_copyMethodList(c, numMethods)
  , p = methods
numMethods = numMethods.getUInt32()

for (var i=0; i<numMethods; i++) {
  var cur = p.getPointer()
    , name = b.sel_getName(b.method_getName(cur))
    , numArgs = b.method_getNumberOfArguments(cur)-2
    , r = b.method_copyReturnType(cur)
    , rtn = r.getCString()
  b.free(r);
  console.error('  '+name);
  console.error('    rtn: %s', rtn)
  console.error('    numArgs: %d', numArgs)
  for (var j=2; j<numArgs+2; j++) {
    var a = b.method_copyArgumentType(cur, j)
      , s = a.getCString();
    b.free(a);
    console.error('      %d: %s', j, s);
  }

  // advance the cursor
  p = p.seek(ffi.Bindings.TYPE_SIZE_MAP.pointer);
}
b.free(methods);
