var b = require('../../core')


b.dlopen("/System/Library/Frameworks/Foundation.framework/Foundation");

// First get the number of classes
var numClasses = b.objc_getClassList(null, 0);
console.error('Number of classes: %d', numClasses);

if (numClasses > 0) {
  var sizeofClass = 8 // need a good way to sizeof for real
    , classes = new b.Pointer(sizeofClass * numClasses)
    , cursor = classes

  b.objc_getClassList(classes, numClasses);

  for (var i=0; i<numClasses; i++) {
    var c = cursor.getPointer()
    console.error(b.class_getName(c));
    cursor = cursor.seek(sizeofClass)
  }

}
