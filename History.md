
2.1.0 / 2015-12-16
==================

  * Update README.md
  * package: update "libxmljs" and use "memwatch-next"
  * package: add "license" field
  * package: update deps
  * travis: test more versions of node
  * enabled `/Library` + `$USER/Library` framework search paths
  * fixes for case-sensitive file systems
  * support complex ivar, e.g. HTTPMethod from CococaHTTPServer

2.0.0 / 2015-04-09
==================

  * rename npm package to lowercase "nodobjc" (╯°□°)╯︵ ┻━┻

1.0.1 / 2015-04-09
==================

  * package: update "ffi", "ref" and "ref-struct" deps
  * test: rearrange some stuff
  * travis: remove node v0.6.x
  * LICENSE: update year to 2015
  * package: update "ref" and "ref-struct" deps
  * Updated NodeCocoaHelloWorld.app example with NodeJS friendly EventLoop implementation
  * Added eventLoop test using timers as alternative to NSRunLoop('mainRunLoop')('run')
  * Fixed resolution of Framework constants like NSDefaultRunLoopMode as NSStirng*
  * Added unittest for failing Framework constant NSString* resolve for NSDefaultRunLoopMode
  * Added ref error/alloc to unit tests
  * unittests: fixed private equal check to indexof
  * Switched instanceof to isBuffer
  * Added void test for issue 48
  * Makefile: fix DOX invocation

1.0.0 / 2014-08-19
==================

  * Official "blocks" support
  * Better test coverage
  * Travis-CI continuous integration testing
  * Updated to use the `ffi` v1 API
  * Re-written (fast!) XML parser specifically for BridgeSupport files
  * Fixes various memory leaking and usage errors
  * Casting function now casts Buffer, Date, and RegExp instances
  * Added a streamlined API for defining method/block function signatures

< 1.0.0
=======

  * Prehistoric: see `git log`
