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

            // Handle loaded wallpaper
            if (position === 'monster' || position === 'wallpaper') {
              var stylingAttrCustom = document.getElementById('adtechWallpaper').getAttribute('style')
              var stylingAttrBody = document.body.getAttribute('style') || 'background:' + window.getComputedStyle(document.body, null).getPropertyValue('background') + ';'
              if (stylingAttrCustom !== null && stylingAttrCustom.match(/url\((.*?)\)/)) {
                loadedMessage += '[styling:' + stylingAttrCustom + ']'
              } else if (stylingAttrBody !== null && stylingAttrBody.match(/url\((.*?)\)/)) {
                loadedMessage += '[styling:' + stylingAttrBody + ']'
              }
            }

            var prebidElement = sf_align.querySelectorAll('.prebidPlaceholder, .prebidPlaceholder_xhb')[0]
            // Tell host about bannersize
            var bannerHeight = sf_align.clientHeight || sf_align.offsetHeight
            var bannerWidth = sf_align.clientWidth || sf_align.offsetWidth
            if (typeof prebidElement !== 'undefined') {
              var prebidType = prebidElement.className
              prebidElement.className = ''
              jppolAdOps.renderPrebidAd('currentBannerForPrebid', prebidType, prebidElement)
              loadedMessage += '|w' + bannerWidth + '|h' + bannerHeight
              $sf.ext.message(loadedMessage)
            } else {
              loadedMessage += '|w' + bannerWidth + '|h' + bannerHeight
              $sf.ext.message(loadedMessage)
            }
          } catch (err) {
            console.error('adtechPlacements[adtechId].complete timeout', err)
          }
        }, 0)
      }

      window.addEventListener('load', adtechPlacements[adtechId].complete, false)

      ADTECH.loadAd(adtechId)
    } catch (err) {
      console.error('inside sfInit.js setupDAC', err)
    }
  }

  function init () {
    try {
      if (currentScript !== null) {
        var adtechUrl = currentScript.src.split('?')[1]
        var adtechData = $sf.ext.meta('adtechData') || '{}'
        var adtechDataObj = JSON.parse(adtechData)
        var prebidData = $sf.ext.meta('prebidData') || '{}'

        if (prebidData !== '{}') {
          var prebidCache = prebidCache || {}

          prebidCache['currentBannerForPrebid'] = JSON.parse(prebidData)
          prebidCache['currentBannerForPrebid'].elementId = 'sfWrapper'
          prebidCache['currentBannerForPrebid'].destID = 'sf_align'

          jppolAdOps.setupPrebid({
            debug: false,
            timeout: prebidCache['currentBannerForPrebid'].timeout,
            cpmValues: prebidCache['currentBannerForPrebid'].cpmValues,
            cpmValuesDKK: prebidCache['currentBannerForPrebid'].cpmValuesDKK,
            isadformusd: prebidCache['currentBannerForPrebid'].isadformusd,
            banners: prebidCache,
            adtechDataObj: adtechDataObj,
            callback: setupDAC
          })
        } else {
          setupDAC(adtechDataObj)
        }
      }
    } catch (err) {
      console.err('inside sfInit.js: init', 'err', err)
    }
  }

  init()
}(window.jppolAdOps = window.jppolAdOps || {}, window.pbjs = window.pbjs || {}, window.ADTECH = window.ADTECH || {}))
