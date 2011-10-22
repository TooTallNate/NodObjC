var b = require('../../core')
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
  ffi.free(r);
  console.error('  '+name);
  console.error('    Returns: %s', rtn)
  for (var j=2; j<numArgs+2; j++) {
    var a = b.method_copyArgumentType(cur, j)
      , s = a.getCString();
    ffi.free(a);
    console.error('      Arg %d: %s', j-2, s);
  }

  // advance the cursor
  p = p.seek(ffi.Bindings.TYPE_SIZE_MAP.pointer);
}
ffi.free(methods);


// Walk the inheritance chain
var superclass = c
  , i = 0;
console.error('\nWalking inheritance chain:');
console.error('  %s', b.class_getName(superclass));
do {
  process.stderr.write('  ');
  i++;
  superclass = b.class_getSuperclass(superclass);
  for (var j=0; j<i; j++) {
    process.stderr.write('  ');
  }
  console.error('↳ %s', b.class_getName(superclass));
} while(!superclass.isNull());
