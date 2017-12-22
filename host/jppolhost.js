'use strict'

;(function (jppolAdOps) {
  /***
  * Defaults
  ***/
  var defaultSupports = {
    'exp-ovr': true,
    'exp-push': false,
    'read-cookie': false,
    'write-cookie': false
  }

  /***
  * Helper: debug
  * Wrapping console to keep from logging when unwanted
  ***/
  var debug = jppolAdOps.debug

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
      console.error('jppol-safeframes: jppolhost.js', 'mergeObj ', err)
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
    try {
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
    } catch (err) {
      console.error('jppol-safeframes: jppolhost.js', 'adtechKvAdder', err)
    }
  }

  var adtechKv = {
    rtb: 'false' // We revert the [true/false] value to match the expected value by adtech
  }

  var adtechKvArr = []
  for (var key in adtechKv) {
    adtechKvArr.push('kv' + key + '=' + adtechKv[key])
  }

  // handle key values for old school ADTECH rendering
  function getKeyValues (placementKv) {
    try {
      var concatArray = []
      if (typeof placementKv !== 'undefined' && Array.isArray(placementKv)) {
        for (var i = placementKv.length; i--;) {
          placementKv[i] = 'kv' + placementKv[i]
        }
        concatArray = placementKv
      } else if (typeof placementKv !== 'undefined' && !Array.isArray(placementKv)) {
        for (var key in placementKv) {
          concatArray.push('kv' + key + '=' + placementKv[key])
        }
      }

      var kvArray = adtechKvArr.concat(concatArray)
      var returnValue = (kvArray.length > 0) ? kvArray.join(';') + ';' : ''
      return returnValue
    } catch (err) {
      console.error('jppol-safeframes: jppolhost.js', 'getKeyValues', err)
    }
  }

  /*******
  ********
  ********
  * ACTUAL SAFEFRAME IMPLEMENTATION
  ********
  ********
  *******/
  function nukeSafeframe (posID) {
    $sf.host.nuke(posID)
  }

  /**
  * onBeforePosMsg
  * A callback function that gets fired before any cancellable action is requested to be peformed from a a SafeFrame, such as expansion, etc. Return true out of this callback function to cancel/disallow the action in question.
  * NOTE: Seems this is never called
  **/
  function beforePosMsg (posID) {
    debug.log('jppol-safeframes: jppolhost.js', 'beforePosMsg', 'is this coming through?', posID)
  }

  /**
  * onPosMsg
  * A callback function that gets fired when an action requested by a SafeFrame is performed
  **/
  function posMsg (posID, type, content) {
    try {
      debug.log('jppol-safeframes: jppolhost.js', 'safeframe posMsg', posID, type, content)
      var nuked = false
      if (content === 'nuke' && sfOptions.fulldebug) {
        debug.log(':::::: NUKED ::::::')
        debug.log('$sf.host.nuke(' + posID + ')  - nuke allowed')
        debug.log(':::::: NUKED ::::::')
      }
      if (content === 'nuke' && sfOptions.allowNuke) {
        debug.log('jppol-safeframes: jppolhost.js', 'safeframe posMsg nuke el:', posID)
        // nuke safeframe through SafeFrame API
        nukeSafeframe(posID)
        nuked = true
      }
      debug.log('jppol-safeframes: jppolhost.js', 'safeframe wallpaper', (sfOptions.wallpaperHandler && typeof sfOptions.wallpaperSelector !== 'undefined'))
      // handle wallpaper
      if (sfOptions.wallpaperHandler && typeof sfOptions.wallpaperSelector !== 'undefined') {
        if (nuked === false && type === 'msg' && sfOptions.wallpaperPositionsString.indexOf(posID) !== -1 && content.indexOf('styling:') !== -1) {
          var bgCSS = content.split('[styling:')[1].split(']')[0]
          var wpEl = null

          // set data-attribute for later reference
          document.documentElement.setAttribute('data-wallpaper-style', 'true');

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

      // handle interscroller
      // if (nuked === false && type === 'msg' && sfOptions.interscrollerHandler && content.indexOf('interscrollerStyle:') !== -1) {
      //   var interscrollerPositionsString = (typeof sfOptions.interscrollerPositions === 'string') ? sfOptions.interscrollerPositions : sfOptions.interscrollerPositions.join(',');
      //   if (interscrollerPositionsString.indexOf(posID) !== -1) {
      //     var interscrollerStyle = content.split('[interscrollerStyle:')[1].split(']')[0];
      //     if (interscrollerStyle) {
      //       // set data-attribute for later reference
      //       document.documentElement.setAttribute('data-interscroller-style', 'true');
      //
      //       // create div elements
      //       var interscrollerWrapper = document.createElement('div');
      //       interscrollerWrapper.style.position = 'absolute';
      //       interscrollerWrapper.style.height = '100vh';
      //       interscrollerWrapper.style.width = '100%';
      //       interscrollerWrapper.style.clip = 'rect(auto auto auto auto)';
      //       interscrollerWrapper.style.verticalAlign = 'initial';
      //       interscrollerWrapper.style.overflow = 'hidden';
      //
      //       var interscrollerDiv = document.createElement('div');
      //       interscrollerWrapper.append(interscrollerDiv);
      //
      //        // add interscroller class to div
      //        // TODO: find a better method
      //       ad.parentNode.parentNode.parentNode.classList.add('ad--interscroller');
      //
      //       // append and set style
      //       ad.parentNode.append(interscrollerWrapper);
      //       interscrollerDiv.setAttribute('style', interscrollerStyle);
      //     }
      //   }
      // }

      // setup object to send to callback function from settings
      var messageObject = {
        'placement': posID,
        'type': type,
        'content': content,
        'nuked': nuked
      }
      // callback function from settings
      if (typeof sfOptions.messageCallback === 'function') {
        sfOptions.messageCallback(messageObject)
      }
    } catch (err) {
      console.error('jppol-safeframes: jppolhost.js', 'safeframe posMsg follow error', err)
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
    debug.log('jppol-safeframes: jppolhost.js', 'safeframe onEndPosRender arguments', posID)
    debug.log('jppol-safeframes: jppolhost.js', 'safeframe onEndPosRender status', $sf.host.status(posID))
    // debug.log('jppol-safeframes: jppolhost.js', 'safeframe onEndPosRender el', document.getElementById(posID + '_trgt'))
  }

  /**
  * Expose nuke funtion
  **/
  jppolAdOps.nukeSafeframe = nukeSafeframe

  /**
  * Set up specific banner Position safeframe
  **/
  jppolAdOps.setupFinalPos = function (positionData, privateDataOptions) {
    try {
      /**
      * Setup data sharing
      **/
      var shared_data_defaults = {
        banner_position: positionData.placement,
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

      debug.log('jppol-safeframes: jppolhost.js', 'safeframe', 'setupFinalPos', positionData)
      if (typeof positionData.placement !== 'undefined') {
        // creating safeframe API PosConfig object
        var posConfigObj = {
          id:	positionData.placement, // position ID
          dest: positionData.destID, // ID of element in parent page
          tgt: '_blank',
          w: positionData.sfWidth, // width of iframe
          h: positionData.sfHeight, // height of iframe
          z: positionData.sfZIndex
        }

        var supports = mergeObject(defaultSupports, positionData.supports)
        posConfigObj.supports = supports
        // console.log('posConfigObj', posConfigObj)
        var posConf = new $sf.host.PosConfig(posConfigObj)

        var keyValueString = getKeyValues(positionData.keyValues)

        debug.log('jppol-safeframes: jppolhost.js', 'safeframe', 'so kv for:', positionData.placement, 'is', keyValueString, 'and type is', positionData.type)
        var bannerID = positionData.bannerID
        var aliasString = ''
        var type = positionData.type
        // resetting some variables based on device
        if (sfOptions.device === 'smartphone') {
          aliasString = 'alias=' + positionData.bannerID + ';'
          bannerID = 0
          type = -1
        }
        var baseBannerSrc = (typeof sfOptions.baseBannerSrc === 'object') ? sfOptions.baseBannerSrc[sfOptions.device] : sfOptions.baseBannerSrc
        if (sfOptions.prebid) {
          baseBannerSrc = 'sfInit.js?'
        }
        var networkId = (typeof sfOptions.adtechNetworkId === 'object') ? sfOptions.adtechNetworkId[sfOptions.device] : sfOptions.adtechNetworkId
        var bannerSrc = baseBannerSrc
        if (!sfOptions.prebid) {
          // create old school ADTECH banner url - this is dependent on correct setup from host
          bannerSrc += networkId + '/' + bannerID + '/0/' + type + '/ADTECH;loc=100;' + aliasString + 'target=_blank;key=key1+key2+key3+key4;' + keyValueString + 'grp=[group];'
        }
        bannerSrc += 'misc=' + new Date().getTime()

        shared_data.bannerurl = bannerSrc
        var posMeta = new $sf.host.PosMeta(shared_data, private_data_key, private_data)

        debug.log('jppol-safeframes: jppolhost.js', 'safeframe', 'so bannerSrc for:', positionData.placement, 'is', bannerSrc, 'with conf', posConf, 'and meta', posMeta, positionData)
        // setup position in safeframe API
        var pos = new $sf.host.Position({
          id: positionData.placement,
          src: bannerSrc,
          conf: posConf,
          meta: posMeta
        })
        $sf.host.render(pos)
      }
    } catch (err) {
      console.error('jppol-safeframes: jppolhost.js', 'jppolAdOps.setupFinalPos', err)
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
    'safeframeURL': '//ebimg.dk/ux/data/safeframe/index.html',
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
    'interscrollerHandler': false,
    'interscrollerPositions': [],
    'allowNuke': true,
    'debug': false, // reset in init function if fulldebug is set to true
    'fulldebug': false
  }

  jppolAdOps.safeframeInit = function (options, privateDataOptions) {
    try {
      sfOptions = mergeObject(sfDefaults, options)
      sfDataPrivate = (typeof privateDataOptions !== 'undefined') ? mergeObject(sfDataPrivateDefaults, privateDataOptions) : sfDataPrivateDefaults
      sfOptions.wallpaperPositionsString = (typeof sfOptions.wallpaperPositions === 'string') ? sfOptions.wallpaperPositions : sfOptions.wallpaperPositions.join(',')
      sfOptions.debug = sfOptions.fulldebug || sfOptions.debug

      debug.setup(sfOptions.debug)
      debug.log('jppol-safeframes: jppolhost.js', 'setting up safeframes with', options, privateDataOptions)

      var renderFileUrl = (sfOptions.safeframeURL.indexOf('?') !== -1) ? sfOptions.safeframeURL + '&debug=' + sfOptions.debug : sfOptions.safeframeURL + '?debug=' + sfOptions.debug

      /**
      * safeframes setup for page
      **/
      var jppolSafeFrameConf = new $sf.host.Config({
        debug: sfOptions.debug,
        renderFile: renderFileUrl,
        onStartPosRender: startPosRender,
        onEndPosRender: endPosRender,
        onBeforePosMsg: beforePosMsg,
        onPosMsg: posMsg
      })
    } catch (err) {
      console.error('jppol-safeframes: jppolhost.js', 'jppolAdOps.safeframeInit', err)
    }
  }
}(window.jppolAdOps = window.jppolAdOps || {}))
