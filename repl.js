var repl = require('repl');
var nodobjc = require('./');

var r = repl.start('NodObjC> ');

// "global" mode
require('setprototypeof')(r.context, nodobjc);
r.context.$ = nodobjc;

// load "Foundation" framework by default
nodobjc.framework('Foundation');
