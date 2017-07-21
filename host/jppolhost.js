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
  /***
  * Helper: mergeObject
  * The values in the overwriteObject will always trump the values in baseObject
  ***/
  function mergeObject (baseObject, overwriteObject) {
    try {
      var returnObj = overwriteObject
      if (typeof overwriteObject === 'undefined') {
        returnObj = baseObject
      } else {
        for (var d in baseObject) {
          if (typeof returnObj[d] === 'undefined') {
            returnObj[d] = baseObject[d]
          }
        }
      }
      return returnObj
    } catch (err) {
      console.error('sharedsafeframes', 'mergeObj ', err)
    }
  }

  /*******
  ********
  ********
  * Handle key-values for banners
  ********
  ********
  *******/
  var adtechKvAdder = function (str, obj) {
    var split_str = str.split(';')
    var strLength = split_str.length
    var obj = obj || {}
    for (var i = strLength - 1; i--;) {
      var kv = split_str[i].replace('kv', '')
      var kvsplit = kv.split('=')
      var k = kvsplit[0]
      var v = kvsplit[1]
      obj[k] = v
    }
    return obj
  }

  var adtechKv = {
    rtb: 'false' // We revert the [true/false] value to match the expected value by adtech
  }

  // <%-- criteo . key value --%>
  if (typeof crtg_content !== 'undefined' && crtg_content !== '') {
    adtechKv = adtechKvAdder(crtg_content, adtechKv)
  }

  // <%-- blue kai . key value --%>
  if (typeof bk_results !== 'undefined' && typeof bk_results.campaigns !== 'undefined') {
    adtechKv.bkcmpid = []
    adtechKv.bkuuid = []
    for (var i in bk_results.campaigns) {
      adtechKv.bkcmpid.push(bk_results.campaigns[i].campaign)
      adtechKv.bkuuid.push(bk_results.campaigns[i].bkuuid)
    }

    var metatag = document.createElement('meta')
    metatag.name = ['WS-Custom-Targeting']
    metatag.content = ['bkcmpid='] + adtechKv.bkcmpid.join('&') + [';bkuuid='] + adtechKv.bkuuid.join('&')
    document.getElementsByTagName('head')[0].appendChild(metatag)
  }

  var adtechKvArr = []
  for (var key in adtechKv) {
    adtechKvArr.push('kv' + key + '=' + adtechKv[key])
  }

  function getKeyValues (placement) {
    var returnValue = (adtechKvArr.length > 0) ? adtechKvArr.join(';') + ';' : ''
    return returnValue
  }

  /*******
  ********
  ********
  * ACTUAL SAFEFRAME IMPLEMENTATION
  ********
  ********
  *******/

  /**
  * onBeforePosMsg
  * A callback function that gets fired before any cancellable action is requested to be peformed from a a SafeFrame, such as expansion, etc. Return true out of this callback function to cancel/disallow the action in question.
  * NOTE: Seems this is never called
  **/
  function beforePosMsg (posID) { }

  /**
  * onPosMsg
  * A callback function that gets fired when an action requested by a SafeFrame is performed
  **/
  function posMsg (posID, type, content) {
    try {
      debug.log('sharedsafeframes', 'safeframe posMsg', posID, type, content)
      var nuked = false
      if (content === 'nuke' && sfOptions.allowNuke) { // || type === 'error') { // TODO: we should handle errors somehow
        debug.log('sharedsafeframes', 'safeframe posMsg nuke el:', posID)
        $sf.host.nuke(posID)
        nuked = true
      }
      debug.log('sharedsafeframes', 'safeframe wallpaper', (sfOptions.wallpaperHandler && typeof sfOptions.wallpaperSelector !== 'undefined'))
      if (sfOptions.wallpaperHandler && typeof sfOptions.wallpaperSelector !== 'undefined') {
        if (nuked === false && type === 'msg' && sfOptions.wallpaperPositionsString.indexOf(posID) !== -1) { // (posID === 'monster' || posID === 'wallpaper')) {
          var bgCSS = content.split('styling:')[1]
          var wpEl = null
          if (sfOptions.wallpaperSelector === 'body') {
            wpEl = document.body
          } else if (sfOptions.wallpaperSelector.match(/[#.]/)) {
            wpEl = document.querySelector(sfOptions.wallpaperSelector)
          } else {
            wpEl = document.getElementById(sfOptions.wallpaperSelector)
          }
          if (wpEl !== null) {
            wpEl.setAttribute('style', bgCSS)
          }
        }
      }

      var messageObject = {
        'placement': posID,
        'type': type,
        'content': content,
        'nuked': nuked
      }

      if (typeof sfOptions.messageCallback === 'function') {
        sfOptions.messageCallback(messageObject)
      }
    } catch (err) {
      debug.error('sharedsafeframes', 'safeframe posMsg follow error', err)
    }
  }

  /**
  * onStartPosRender
  * A callback function that gets fired when a SafeFrame starts to render 3rd party content.
  **/
  function startPosRender (posID) { }

  /**
  * onEndPosRender
  * A callback function that gets fired when a SafeFrame finishes rendering 3rd party content.
  **/
  function endPosRender (posID) {
    debug.log('sharedsafeframes', 'safeframe onEndPosRender arguments', posID)
    debug.log('sharedsafeframes', 'safeframe onEndPosRender status', $sf.host.status(posID))
    debug.log('sharedsafeframes', 'safeframe onEndPosRender el', document.getElementById(posID + '_trgt'))
  }

  /**
  * Set up specific banner Position safeframe
  **/
  jppolAdOps.setupFinalPos = function (positionData, privateDataOptions) {
    try {
      /**
      * Setup data sharing
      **/
      var shared_data_defaults = {
        banner_position: positionData.id,
        banner_label: positionData.prefixit,
        content_id: positionData.bannerID
      }

      var shared_data = mergeObject(shared_data_defaults, positionData.shared_data)

      var private_data_key = sfDataPrivate.key
      var private_data = {}

      if (typeof privateDataOptions !== 'undefined') {
        private_data_key = privateDataOptions.key || private_data_key
        delete privateDataOptions.key
        private_data = privateDataOptions
      }

      var posMeta = new $sf.host.PosMeta(shared_data, private_data_key, private_data)

      debug.log('sharedsafeframes', 'safeframe', 'setupFinalPos', positionData)
      if (typeof positionData.id !== 'undefined') {
        var posConf = new $sf.host.PosConfig({
          id:	positionData.id, // position ID
          dest: positionData.destID, // ID of element in parent page
          tgt: '_blank',
          w: positionData.sfPos.sfWidth, // width of iframe
          h: positionData.sfPos.sfHeight, // height of iframe
          z: positionData.sfPos.zIndex
        })

        var keyValueString = getKeyValues(positionData.id)

        debug.log('sharedsafeframes', 'safeframe', 'so kv for:', positionData.id, 'is', keyValueString, 'and type is', positionData.type)
        var bannerID = positionData.bannerID
        var aliasString = ''
        var type = positionData.type
        if (sfOptions.device === 'smartphone') {
          aliasString = 'alias=' + positionData.bannerID + ';'
          bannerID = 0
          type = -1
        }
        var baseBannerSrc = (typeof sfOptions.baseBannerSrc === 'object') ? sfOptions.baseBannerSrc[sfOptions.device] : sfOptions.baseBannerSrc
        var networkId = (typeof sfOptions.adtechNetworkId === 'object') ? sfOptions.adtechNetworkId[sfOptions.device] : sfOptions.adtechNetworkId
        var bannerSrc = baseBannerSrc + networkId + '/' + bannerID + '/0/' + type + '/ADTECH;loc=100;' + aliasString + 'target=_blank;key=key1+key2+key3+key4;' + keyValueString + 'grp=[group];misc=' + new Date().getTime()
        debug.log('sharedsafeframes', 'safeframe', 'so bannerSrc for:', positionData.id, 'is', bannerSrc, 'with conf', posConf, 'and meta', posMeta, positionData)
        var pos = new $sf.host.Position({
          id: positionData.id,
          src: bannerSrc,
          conf: posConf,
          meta: posMeta
        })
        $sf.host.render(pos)
      }
    } catch (err) {
      debug.error('sharedsafeframes', 'jppolAdOps.setupFinalPos', err)
    }
  }

  /**
  * Initialize jppol safeframes for publication
  **/
  var sfDataPrivate
  var sfDataPrivateDefaults = {
    'key': 'sfForJPPol'
  }

  var sfOptions
  var sfDefaults = {
    'device': 'desktop',
    'safeframeURL': '//ebimg.dk/ux/data/safeframe/safeframe.html?v=9',
    'baseBannerSrc': {
      'desktop': '//adserver.adtech.de/addyn/3.0/',
      'smartphone': '//a.adtech.de/addyn/3.0/',
      'tablet': '//adserver.adtech.de/addyn/3.0/'
    },
    'adtechNetworkId': {
      'desktop': '323',
      'smartphone': '323.0',
      'tablet': '323'
    },
    'wallpaperHandler': false,
    'wallpaperSelector': 'adtechWallpaper',
    'wallpaperPositions': ['monster', 'wallpaper'],
    'allowNuke': true,
    'debug': false
  }

  jppolAdOps.safeframeInit = function (options, privateDataOptions) {
    try {
      sfOptions = mergeObject(sfDefaults, options)
      sfDataPrivate = (typeof privateDataOptions !== 'undefined') ? mergeObject(sfDataPrivateDefaults, privateDataOptions) : sfDataPrivateDefaults
      sfOptions.wallpaperPositionsString = (typeof sfOptions.wallpaperPositions === 'string') ? sfOptions.wallpaperPositions : sfOptions.wallpaperPositions.join(',')
      debug.setup(sfOptions.debug)
      debug.log('sharedsafeframes', 'setting up safeframes with', options, privateDataOptions)
      /**
      * safeframes setup for page
      **/
      var jppolSafeFrameConf = new $sf.host.Config({
        debug: sfOptions.debug,
        renderFile: sfOptions.safeframeURL,
        onStartPosRender: startPosRender,
        onEndPosRender: endPosRender,
        onBeforePosMsg: beforePosMsg,
        onPosMsg: posMsg
      })
    } catch (err) {
      debug.error('sharedsafeframes', 'jppolAdOps.safeframeInit', err)
    }
  }
}(window.jppolAdOps = window.jppolAdOps || {}))
