'use strict';

(function (jppolAdOps, pbjs, ADTECH) {
  var currentScript = document.currentScript || document.getElementById('sf_align').children[1]

  function askAdtech (adtechUrl) {
    try {
      var adtechScript = document.createElement('script')
      adtechScript.src = adtechUrl
      currentScript.parentNode.appendChild(adtechScript)
    } catch (err) {
      console.error('inside sfInit.js askAdtech', err)
    }
  }

  function setupDAC (obj) {
    try {
      console.log('setupDAC', obj)
      var adtechKv = {}
      var adtechParams = {}

      ADTECH.config.page = {
        protocol: 'https',
        server: 'ekstrabladetsalg.ekstrabladet.dk',
        network: '323.0',
        pageid: 0,
        kv: adtechKv,
        params: adtechParams
      }

      var position = obj.placement
      var adtechId = obj.adtechId
      console.log('inside sfInit.js setupDAC adtechId', adtechId, 'obj', obj)
      var adtechPlacements = ADTECH.config.placements
      adtechPlacements[adtechId] = {
        adContainerId: 'sf_align',
        params: {
          loc: '100',
          alias: position
        },
        kv: obj.kv
      }

      adtechPlacements[adtechId].complete = function () {
        setTimeout(function () {
          try {
            var loadedMessage = 'safeframeloaded'

            if (position === 'monster' || position === 'wallpaper') {
              var stylingAttrCustom = document.getElementById('adtechWallpaper').getAttribute('style')
              var stylingAttrBody = document.body.getAttribute('style') || 'background:' + window.getComputedStyle(document.body, null).getPropertyValue('background') + ';'
              // debug.log('safeframes: inside safeframe', 'wallpaper style:', stylingAttrBody, '||', stylingAttrCustom)
              if (stylingAttrCustom !== null && stylingAttrCustom.match(/url\((.*?)\)/)) {
                loadedMessage += '[styling:' + stylingAttrCustom + ']'
              } else if (stylingAttrBody !== null && stylingAttrBody.match(/url\((.*?)\)/)) {
                loadedMessage += '[styling:' + stylingAttrBody + ']'
              }
              // debug.log('safeframes: inside safeframe', 'got wallpaper from', position, stylingAttrCustom, stylingAttrBody)
            }

            var prebidElement = sf_align.querySelectorAll('.prebidPlaceholder, .prebidPlaceholder_xhb')[0]
            console.log('xxxYx, prebidElement', prebidElement)
            if (typeof prebidElement !== 'undefined') {
              console.log('xxxYx position, prebidElement.classList, prebidElement', position, prebidElement.className, prebidElement)
              var prebidType = prebidElement.className
              prebidElement.className = ''
              jppolAdOps.renderPrebidAd('currentBannerForPrebid', prebidType, prebidElement)
              loadedMessage += '|w' + sf_align.clientWidth + '|h' + sf_align.clientHeight
              $sf.ext.message(loadedMessage)
            } else {
              loadedMessage += '|w' + sf_align.clientWidth + '|h' + sf_align.clientHeight
              $sf.ext.message(loadedMessage)
            }
            console.log('xxxYx, loadedMessage', loadedMessage)
          } catch (err) {
            console.error('adtechPlacements[adtechId].complete timeout', err)
          }
        }, 0)
      }

      ADTECH.loadAd(adtechId)
    } catch (err) {
      console.error('inside sfInit.js setupDAC', err)
    }
  }

  function init () {
    try {
      if (currentScript !== null) {
        var adtechUrl = currentScript.src.split('?')[1]
        var adtechData = $sf.ext.meta('adtechData')
        var adtechDataObj = JSON.parse(adtechData)
        var prebidData = $sf.ext.meta('prebidData')
        console.log('inside sfInit.js', 'adtechData', typeof adtechData, adtechDataObj !== '{}')
        console.log('inside sfInit.js', 'prebidData', typeof prebidData, prebidData !== '{}')

        if (prebidData !== '{}') {
          var prebidCache = prebidCache || {}

          prebidCache['currentBannerForPrebid'] = JSON.parse(prebidData)
          prebidCache['currentBannerForPrebid'].elementId = 'sfWrapper'
          prebidCache['currentBannerForPrebid'].destID = 'sf_align'

          console.log('xxxYx inside sfInit.js', 'setup listener eventName jppolAdOps.eventName', jppolAdOps.eventName)
          // window.addEventListener(jppolAdOps.eventName, function (ev) {
          //   var prebidData = ev.detail
          //   console.log('xxxYx inside sfInit.js', 'eventName fired - prebidData', prebidData)
          //   obj.kv = jppolAdOps.mergeObject(obj.kv, prebidData.placement.placementKV)
          //   if (prebidData.adUnit === obj.placement) {
          //     console.log('xxxYx inside sfInit.js', 'now we do some awesome shit')
          //     // askAdtech(adtechDataObj)
          //     setupDAC(adtechDataObj)
          //   }
          // }, false)
          jppolAdOps.setupPrebid({
            debug: false,
            timeout: prebidCache['currentBannerForPrebid'].timeout,
            cpmValues: prebidCache['currentBannerForPrebid'].cpmValues,
            cpmValuesDKK: prebidCache['currentBannerForPrebid'].cpmValuesDKK,
            isadformusd: prebidCache['currentBannerForPrebid'].isadformusd,
            // bannerurl: $sf.ext.meta('bannerurl'),
            banners: prebidCache,
            adtechDataObj: adtechDataObj,
            callback: setupDAC
          })
        } else {
          // console.log('inside sfInit.js', 'before asking adtech')
          // askAdtech(adtechDataObj)
          setupDAC(adtechDataObj)
        }
      }
    } catch (err) {
      console.err('inside sfInit.js: init', 'err', err)
    }
  }

  init()
  // console.log('$sf.ext.meta(propName, ownerKey)', $sf.ext.meta('prebidData'))
  // var prebidData = $sf.ext.meta('prebidData')
  // console.log('$sf.ext.meta(propName, ownerKey)', JSON.parse(prebidData))
  // var prebidCache = prebidCache || {}
  //
  // prebidCache['currentBannerForPrebid'] = JSON.parse(prebidData)
  // prebidCache['currentBannerForPrebid'].elementId = 'sfWrapper'
  // prebidCache['currentBannerForPrebid'].destID = 'sf_align'
  //
  // jppolAdOps.setupPrebid({
  //   debug: debug,
  //   timeout: prebidCache['currentBannerForPrebid'].timeout,
  //   cpmValues: prebidCache['currentBannerForPrebid'].cpmValues,
  //   cpmValuesDKK: prebidCache['currentBannerForPrebid'].cpmValuesDKK,
  //   isadformusd: prebidCache['currentBannerForPrebid'].isadformusd,
  //   bannerurl: $sf.ext.meta('bannerurl'),
  //   banners: prebidCache
  // })
  //
  // var position = $sf.ext.meta('banner_position')
  // if (position === 'intextbanner') {
  //   $sf.ext.register(930, 180, status_update)
  // }
  //
  // var sf_align = document.getElementById('sf_align')
  // sf_align.classList.add(position)
  // sf_align.parentNode.classList.add(position)
  // debug.log('safeframes: inside safeframe', 'position:', position)
}(window.jppolAdOps = window.jppolAdOps || {}, window.pbjs = window.pbjs || {}, window.ADTECH = window.ADTECH || {}))
