'use strict'

;(function (jppolAdOps) {
  /***
  * Helper: debug
  * Wrapping console to keep from logging when unwanted
  ***/
  var debug = {}
  debug.setup = function (doDebug) {
    debug.log = (doDebug) ? window.console.log : function () {}
    debug.error = (doDebug) ? window.console.error : function () {}
  }

  jppolAdOps.debug = debug
}(window.jppolAdOps = window.jppolAdOps || {}))
