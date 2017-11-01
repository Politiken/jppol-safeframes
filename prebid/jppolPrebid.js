'use strict'

;(function (jppolAdOps, pbjs) {
  pbjs.que = pbjs.que || []

  var ebBidReturns = {}
  var bidTimeout = 800

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
      console.error('prebid: prebid-desktop.js', 'mergeObj ', err)
    }
  }

  /***
  * Helper: triggerEvent
  * The values in the overwriteObject will always trump the values in baseObject
  ***/
  function triggerEvent (el, eventName, options) {
    try {
      var event
      if (typeof CustomEvent === 'function') {
        event = new CustomEvent(eventName, options)
      } else if (document.createEvent) {
        event = document.createEvent('HTMLEvents')
        event.initEvent(eventName, true, true)
        if (typeof options !== 'undefined') {
          event.detail = options.detail
        }
      } else if (document.createEventObject) { // IE < 9
        event = document.createEventObject()
        event.eventType = eventName
      }
      event.eventName = eventName
      if (el.dispatchEvent) {
        el.dispatchEvent(event, false)
      } else if (el[eventName]) {
        el[eventName]()
      }
    } catch (err) {
      console.error('triggerEvent', err)
    }
  }

  jppolAdOps.triggerEvent = triggerEvent
  jppolAdOps.prebidCache = {}

  function addBannersToPrebid (banners) {
    var ebpc = banners
    pbjs.que.push(function () {
      var adUnits = jppolAdOps.biddersetup(banners)
      console.log('xxxYx adUnits', adUnits)
      jppolAdOps.prebidDone = {
        'status': 'undone'
      }

      if (adUnits.length > 0) {
        pbjs.addAdUnits(adUnits)

        pbjs.requestBids({
          timeout: bidTimeout,
          bidsBackHandler: function (bidResponse) {
            try {
              console.log('prebid', 'bidResponse', bidResponse)
              if (typeof bidResponse !== 'undefined' && Object.keys(bidResponse).length !== 0) {
                for (var key in bidResponse) {
                  console.log('prebid', 'key in bidResponse', bidResponse[key])
                  var bidsReturned = bidResponse[key].bids
                  var adUnitCode = bidsReturned[0].adUnitCode
                  console.log('prebid', 'bidResponse adUnitCode', adUnitCode)
                  var adPlacement = ebpc[adUnitCode] || ''
                  console.log('prebid', 'bidResponse adPlacement', adPlacement, ' - jppolAdOps.prebidSettings - ', jppolAdOps.prebidSettings)
                  var askAdtech = (adPlacement !== '') ? true : false
                  console.log('prebid', 'bidResponse getting params from pbjs for adUnitCode', adUnitCode, 'askAdtech', askAdtech)

                  var params = pbjs.getAdserverTargetingForAdUnitCode(adUnitCode) || {}

                  console.log('prebid', 'bidResponse setting params from pbjs to ebBidReturns', params, adUnitCode)

                  // ebBidReturns[adUnitCode] = params
                  jppolAdOps.prebidCache[adUnitCode] = {}
                  jppolAdOps.prebidCache[adUnitCode].params = params
                  var winningCPM = params['hb_pb'] || 0
                  if (typeof winningCPM === 'string') {
                    winningCPM = parseFloat(winningCPM)
                  }

                  console.log('prebid', 'bidsReturned', bidsReturned)

                  // if Adform is the winner of the auction, figure out if we need to use DKK or USD as currency
                  var cpms = (params['hb_bidder'] === 'adform' && jppolAdOps.prebidSettings.isadformusd === false) ? jppolAdOps.prebidSettings['cpmValuesDKK'] : jppolAdOps.prebidSettings['cpmValues']
                  var xhbDeal = (params['hb_xhb_deal'] === '99999999')

                  var minimumCPM = parseFloat(cpms[cpms.length - 1])
                  console.log('prebid', 'Is winning cpm ', winningCPM, 'from', params['hb_bidder'], 'higher than or equal to our minimum cpm', minimumCPM, (winningCPM >= minimumCPM))
                  console.log('prebid', 'Got xhbDeal ', xhbDeal)
                  console.log('prebid', 'should', adUnitCode, 'askAdtech', askAdtech, 'with winningCPM:', winningCPM, 'from', bidsReturned.length, 'bids')
                  console.log('prebid', 'adtech', 'winningCPM', winningCPM, 'cpmValues from secParam', cpms)
                  adPlacement.placementKV = {} // TODO: DAC type KV
                  adPlacement.placementKVsafeframe = []

                  if (xhbDeal) {
                    adPlacement.placementKV['prebidXHB'] = 1
                    adPlacement.placementKVsafeframe.push('prebidXHB=1')
                  }

                  for (var i = cpms.length; i--;) {
                    var floatCPM = parseFloat(cpms[i])
                    if (winningCPM >= floatCPM) {
                      adPlacement.placementKV['prebid' + (i + 1)] = 1
                      adPlacement.placementKVsafeframe.push('prebid' + (i + 1) + '=1')
                    }
                  }
                  // adPlacement.placementKV['prebid1'] = 1 // TODO: ONLY FOR TESTING!!!
                  // adPlacement.placementKVsafeframe.push('prebid1=1') // TODO: ONLY FOR TESTING!!!

                  console.log('xxxYx prebid', 'adtech', 'placementKV: ', adPlacement.placementKV, 'placementKVsafeframe: ', adPlacement.placementKVsafeframe, 'winningCPM', winningCPM)
                  console.log('xxxYx prebid - jppolAdOps.eventName', jppolAdOps.eventName)
                  console.log('xxxYx prebid - jppolAdOps.prebidSettings', jppolAdOps.prebidSettings)

                  // jppolAdOps.prebidDone[adUnitCode] = {
                  //   'adUnit': adUnitCode,
                  //   'placement': adPlacement
                  // }
                  var adtechDataObj = jppolAdOps.prebidSettings.adtechDataObj
                  adtechDataObj.kv = mergeObject(adPlacement.placementKV, jppolAdOps.prebidSettings.adtechDataObj.kv)

                  jppolAdOps.prebidSettings.callback(adtechDataObj)

                  // jppolAdOps.triggerEvent(window, jppolAdOps.eventName, {
                  //   'detail': jppolAdOps.prebidDone[adUnitCode]
                  // })
                }
                jppolAdOps.prebidDone['status'] = 'done'
              }
            } catch (err) {
              console.error('prebid', 'bidsBackHandler', err)
            }
          }
        })
      }
    })
  }

  function renderPrebidAd (posID, prebidType, container) {
    try {
      if (container !== null && typeof jppolAdOps.prebidCache[posID] !== 'undefined') {
        var params = jppolAdOps.prebidCache[posID].params

        var size = (prebidType.indexOf('xhb') === -1 && typeof params.hb_size !== 'undefined') ? params.hb_size.split('x') : params.hb_xhb_size.split('x')
        var paramName = (prebidType.indexOf('xhb') === -1) ? 'hb_adid' : 'hb_xhb_adid'
        var newIframe = document.createElement('iframe')

        var heightStyle = 'height:' + size[1] + 'px;'
        var styleStr = 'border:0;margin:0 auto;' + 'width:' + size[0] + 'px;' + heightStyle
        newIframe.setAttribute('style', styleStr)
        newIframe.setAttribute('scrolling', 'no')
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }
        container.setAttribute('style', heightStyle)
        container.appendChild(newIframe)
        var iframeDoc = newIframe.contentWindow.document
        // and then we render
        console.log('prebid', 'now we render? (params)', params, paramName)
        iframeDoc.body.setAttribute('style', 'margin:0;padding:0;')
        pbjs.renderAd(iframeDoc, params[paramName])
        newIframe.addEventListener('load', function () {
          iframeDoc.body.setAttribute('style', 'margin:0;padding:0;')
        }, false)
      }
    } catch (err) {
      console.error('sfPrebid', 'renderPrebidAd', err)
    }
  }

  function setupPrebid (options) {
    var prebidDefault = {
      debug: false,
      timeout: 700,
      cpmValues: [9, 5, 2],
      cpmValuesDKK: [60, 20, 10],
      isadformusd: false
    }

    jppolAdOps.prebidSettings = mergeObject(prebidDefault, options)
    console.log('jppolAdOps.prebidSettings.banners', jppolAdOps.prebidSettings.banners)
    addBannersToPrebid(jppolAdOps.prebidSettings.banners)
  }

  jppolAdOps.addBannersToPrebid = addBannersToPrebid
  jppolAdOps.renderPrebidAd = renderPrebidAd
  jppolAdOps.setupPrebid = setupPrebid
}(window.jppolAdOps = window.jppolAdOps || {}, window.pbjs = window.pbjs || {}))
