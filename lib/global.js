
/**
 * NodObjC actually has 2 "modes" of operation:
 *
 * ### "module-mode"
 *
 * "module-mode" is the default mode that happens by simply requiring the
 * `NodObjC` module and working with the returned exports. The name of the
 * variable throughout the examples is `$`.
 *
 * ``` js
 * var $ = require('NodObjC');
 *
 * $.import('Foundation');
 *
 * var obj = $.NSObject('alloc')('init');
 * …
 * ```
 *
 * ### "global-mode"
 *
 * "global-mode" is where the Objective-C symbols also get added to the global
 * scope of the current program, so that the `$` all the time is not
 * necessary. Global mode is usually a more pleasant environment to work in,
 * but it should only be used by end programs, and not by modules that depend
 * on NodObjC. To enable global mode you simply require `NodObjC/global`, and
 * after that all NodObjC symbols will be available globally
 *
 * ``` js
 * require('NodObjC/global');
 *
 * importFramework('Foundation');
 *
 * var obj = NSObject('alloc')('init');
 * …
 * ```
 *
 */

exports = module.exports = {}

/*!
 * Module dependencies.
 */

var Import = require('./import')

/*!
 * Set the initial exports onto the $ function.
 */

exports.resolve = Import.resolve
exports.import  = Import.import
exports.framework = Import.import
exports.importFramework = Import.import
