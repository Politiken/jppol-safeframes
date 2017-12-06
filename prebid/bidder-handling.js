'use strict'

;(function (jppolAdOps, prebidCache) {
  /**
  * # getRubiconSize
  * Get current bannersize from rubicon sizemap
  * TODO: NB! the sizemap should be updated if prebid Rubicon adapter is changed
  **/
  function getRubiconSize (pbSize) {
    var sizeMap = {
      1: '468x60',
      2: '728x90',
      8: '120x600',
      9: '160x600',
      10: '300x600',
      14: '250x250',
      15: '300x250',
      16: '336x280',
      19: '300x100',
      31: '980x120',
      32: '250x360',
      33: '180x500',
      35: '980x150',
      37: '468x400',
      38: '930x180',
      43: '320x50',
      44: '300x50',
      48: '300x300',
      54: '300x1050',
      55: '970x90',
      57: '970x250',
      58: '1000x90',
      59: '320x80',
      60: '320x150',
      61: '1000x1000',
      65: '640x480',
      67: '320x480',
      68: '1800x1000',
      72: '320x320',
      73: '320x160',
      78: '980x240',
      79: '980x300',
      80: '980x400',
      83: '480x300',
      94: '970x310',
      96: '970x210',
      101: '480x320',
      102: '768x1024',
      103: '480x280',
      113: '1000x300',
      117: '320x100',
      125: '800x250',
      126: '200x600'
    }

    for (var key in sizeMap) {
      if (sizeMap[key] === pbSize) {
        return key
      }
    }
  }

  /**
  * # getBidders
  * create bidder data to send to prebid
  **/
  function getBidders (obj) {
    var ebBidders = []

    var sizes = obj.sizes
    var sizesLength = sizes.length
    for (var i = 0; i < sizesLength; i++) {
      var sizeJoint = sizes[i].join('x')

      if (typeof obj.pubmaticAdSlot !== 'undefined') {
        obj.pubmaticAdSlotArr = obj.pubmaticAdSlotArr || []
        obj.pubmaticAdSlotArr.push(obj.pubmaticAdSlot + '@' + sizeJoint)
      }

      if (typeof obj.rubiconZone !== 'undefined') {
        obj.rubiconSizes = obj.rubiconSizes || []
        var rubiconSize = getRubiconSize(sizeJoint)
        if (typeof rubiconSize !== 'undefined') {
          obj.rubiconSizes.push(rubiconSize)
        }
      }
    }

    /**
    ADFORM
    http://prebid.github.io/dev-docs/bidders.html#adform
    */
    if (typeof obj.adformMID !== 'undefined') {
      // console.log('prebid', 'add adform bidder with mid:', obj.adformMID, ' and USD? ', jppolAdOps.prebidSettings.isadformusd)
      var adformObj = {
        bidder: 'adform',
        params: {
          mid: obj.adformMID
        }
      }
      // If section.parameters['banner.prebid.adform.usd'] is true, set adform currency to USD
      if (jppolAdOps.prebidSettings.isadformusd === true) {
        adformObj.params.rcur = 'USD'
      }
      ebBidders.push(adformObj)
    }

    /**
    Rubicon
    http://prebid.github.io/dev-docs/bidders.html#rubicon

    Smartpone
    ad size - rubicon size id
    300x250 = 15
    320x50 = 43
    320x80 = 59
    320x320 = 72
    320x160 = 73
    */
    if (typeof obj.rubiconZone !== 'undefined' && typeof obj.rubiconSizes !== 'undefined') {
      // console.log('prebid', 'add rubicon bidder with zoneId:', obj.rubiconZone, ' and sizes ', obj.rubiconSizes)
      ebBidders.push({
        bidder: 'rubicon',
        params: {
          accountId: 10093,
          siteId: 23382,
          zoneId: obj.rubiconZone,
          sizes: obj.rubiconSizes
        }
      })
    }

    /**
    PubMatic
    http://prebid.github.io/dev-docs/bidders.html#pubmatic
    */
    if (typeof obj.pubmaticAdSlot !== 'undefined' && typeof obj.pubmaticAdSlotArr !== 'undefined') {
      // console.log('prebid', 'add pubmatic bidder with adSlot name:', obj.pubmaticAdSlot, ' and number of adslots ', obj.pubmaticAdSlotArr.length)
      for (var i = sizesLength; i--;) {
        var PubMaticAdslotName = obj.pubmaticAdSlotArr[i]
        ebBidders.push({
          bidder: 'pubmatic',
          params: {
            publisherId: 156010,
            adSlot: PubMaticAdslotName
          }
        })
      }
    }

    /**
    CRITEO
    http://prebid.org/dev-docs/bidders.html#criteo
    */
    if (typeof obj.criteoId !== 'undefined') {
      // console.log('prebid', 'add criteo bidder with adSlot name:', obj.criteoId)
      ebBidders.push({
        bidder: 'criteo',
        params: {
          zoneId: obj.criteoId
        }
      })
    }

    /**
    Xaxis
    http://prebid.org/dev-docs/bidders.html#xhb
    */
    if (typeof obj.xaxis !== 'undefined') {
      // console.log('prebid', 'add xaxis bidder with adSlot name:', obj.xaxis)
      ebBidders.push({
        bidder: 'xhb',
        params: {
          placementId: obj.xaxis
        }
      })
    }

    return ebBidders
  }

  /**
  handleBanner
  handle specific banner position, after prebid returns data
  */
  function handleBanner (argObj) {
    // console.log('prebid', 'adtech', 'handleBanner', argObj)
    var placementKV = {}
    var position = argObj.elementId
    if (position === 'intext_outer') {
      var intextElement = document.getElementById(position)
      // insert banner HTML
      intextElement.innerHTML = argObj.bannerHTML
      // Position update
      position = 'intextbanner'
    }
    /**
    Key Values added to ADTECH call according to their value in USD
    */
    if (typeof argObj.adUnitCode !== 'undefined') {
      var cpmValuesToKV = argObj.cpms // jppolAdOps.settings['cpmValues']
      // console.log('prebid', 'adtech', 'winningCPM', argObj.winningCPM, 'cpmValues from secParam', cpmValuesToKV)

      if (argObj.sendXHBDeal) {
        placementKV['prebidXHB'] = 1
      } else {
        for (var i = cpmValuesToKV.length; i--;) {
          var floatCPM = parseFloat(cpmValuesToKV[i])
          if (argObj.winningCPM >= floatCPM) {
            placementKV['prebid' + (i + 1)] = 1
          }
        }
      }

      // console.log('prebid', 'adtech', 'placementKV: ', placementKV, argObj.winningCPM)
    }

    /**
    ADTECH banner object created - DAC specs
    */
    var bannerObj = {
      adContainerId: position,
      kv: placementKV,
      params: {
        loc: '100',
        alias: argObj.adtechId
      }
    }
    // console.log('prebid', 'adtech banner', bannerObj)

    if (typeof ADTECH !== 'undefined') {
      ADTECH.config.placements[argObj.adtechId] = bannerObj

      ADTECH.config.placements[argObj.adtechId].complete = function () {
        jppolAdOps.returnedFromAdtech(position, argObj.adUnitCode)
      }

      // console.log('prebid', 'adtech', 'bingo', 'load this now', argObj.adtechId)
      ADTECH.loadAd(argObj.adtechId)
    } else {
      jppolAdOps.adQueue = jppolAdOps.adQueue || []
      // console.log('prebid', 'adtech', 'bingo', 'added to queue', argObj.adtechId)
      jppolAdOps.adQueue.push(bannerObj)
    }
  }
  // console.log('prebid', 'adtech', 'add handleBanner to jppolAdOps')

  function biddersetup (prebidCache) {
    try {
      var adUnits = []
      // console.log('prebid', 'biddersetup prebidCache', prebidCache)
      for (var key in prebidCache) {
        var element = document.getElementById(prebidCache[key].elementId)
        // console.log('prebid', 'biddersetup', element)
        var bidders = (typeof prebidCache[key].sizes !== 'undefined') ? getBidders(prebidCache[key]) : []
        // console.log('prebid', 'biddersetup bidders', bidders)
        adUnits.push({
          code: key,
          sizes: prebidCache[key].sizes,
          bids: bidders
        })
      // if (element !== null && bidders.length > 0) {
      //   console.log('prebid', 'biddersetup', 'adUnits.push')
      //   adUnits.push({
      //     code: prebidCache[key].elementId,
      //     sizes: prebidCache[key].sizes,
      //     bids: bidders
      //   })
      // } else if (typeof prebidCache[key].adtechId !== 'undefined') {
      //   console.log('prebid', 'biddersetup', 'directly to adtech, jppolAdOps.handleBanner')
      //   jppolAdOps.handleBanner({
      //     'elementId': prebidCache[key].elementId,
      //     'adtechId': prebidCache[key].adtechId,
      //     'bannerHTML': prebidCache[key].bannerHTML || ''
      //   })
      // }
      }
      // console.log('prebid', 'adUnits from biddersetup', adUnits)

      return adUnits
    } catch (err) {
      console.error('prebid', 'biddersetup', err)
    }
  }

  jppolAdOps.handleBanner = handleBanner
  jppolAdOps.biddersetup = biddersetup
}(window.jppolAdOps = window.jppolAdOps || {}, window.prebidCache = window.prebidCache || {}))
