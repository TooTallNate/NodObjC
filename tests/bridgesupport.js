var bs = require('../bridgesupport')

var SB = bs('/System/Library/Frameworks/ScriptingBridge.framework/Resources/BridgeSupport/ScriptingBridgeFull.bridgesupport');
console.log(SB);
console.log(SB.SBObject.prototype);
