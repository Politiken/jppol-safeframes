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

  function setupDAC () {
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
  }

  function init () {
    try {
      // console.log('inside sfInit.js', currentScript)
      if (currentScript !== null) {
        // console.log('inside sfInit.js', currentScript.src.split('?'))

        var adtechUrl = currentScript.src.split('?')[1]

        // console.log('inside sfInit.js', adtechUrl)
        // console.log('inside sfInit.js', '$sf.ext.meta(prebidData)', $sf.ext.meta('prebidData'))
        var prebidData = $sf.ext.meta('prebidData')
        // console.log('inside sfInit.js', 'JSON.parse(prebidData)', JSON.parse(prebidData))
        //

        console.log('inside sfInit.js', 'prebidData', typeof prebidData, prebidData)

        if (prebidData !== '{}') {
          var prebidCache = prebidCache || {}

          prebidCache['currentBannerForPrebid'] = JSON.parse(prebidData)
          prebidCache['currentBannerForPrebid'].elementId = 'sfWrapper'
          prebidCache['currentBannerForPrebid'].destID = 'sf_align'

          window.addEventListener(jppolAdOps.eventName, function (ev) {
            var prebidData = ev.detail
            console.log('inside sfInit.js', 'eventName fired - prebidData', prebidData)
            obj.kv = jppolAdOps.mergeObject(obj.kv, prebidData.placement.placementKV)
            if (prebidData.adUnit === obj.placement) {
              console.log('inside sfInit.js', 'now we do some awesome shit')
          // handleFinalBanner(obj)
            }
          }, false)
          jppolAdOps.setupPrebid({
            debug: debug,
            timeout: prebidCache['currentBannerForPrebid'].timeout,
            cpmValues: prebidCache['currentBannerForPrebid'].cpmValues,
            cpmValuesDKK: prebidCache['currentBannerForPrebid'].cpmValuesDKK,
            isadformusd: prebidCache['currentBannerForPrebid'].isadformusd,
            bannerurl: $sf.ext.meta('bannerurl'),
            banners: prebidCache
          })
        } else {
          console.log('inside sfInit.js', 'before asking adtech')
          askAdtech(adtechUrl)
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
