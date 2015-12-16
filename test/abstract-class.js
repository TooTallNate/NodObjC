const $ = require('../');
const assert = require('assert');

$.import('Foundation');

var success = false;
var appSchema = $.NSURLProtocol.extend('URLAppSchema');

// methodsd on the class
appSchema.addClassMethod('canInitWithRequest:', 'c@:@', function(self, cmd, theRequest) {
    success = true;
    return $.NO;
});
appSchema.addClassMethod('canonicalRequestForRequest:', '@@:@', function(self, cmd, request) {
    return request;
});

// methods on the instances
appSchema.addMethod('startLoading','v@:', function(self, cmd) {
});

appSchema.addMethod('stopLoading','v@:', function(self, cmd) {
});

// finalize the class (new methods can still be added, but no new
// ivars since the size of the class is now fixed)
appSchema.register();

$.NSURLProtocol('registerClass', $.URLAppSchema('class'));


var theRequest = $.NSURLRequest(
    'requestWithURL', $.NSURL('URLWithString', $('app://test')),
    'cachePolicy', $.NSURLRequestUseProtocolCachePolicy,
    'timeoutInterval', 60.0
  );

var theConnection = $.NSURLConnection('alloc')(
    'initWithRequest', theRequest,
    'delegate', appSchema
  );

setTimeout(function () {
  assert.ok(success, 'The app schema was not registered.');
}, 1000);
