(function (jppolAdOps, ebPlacement, prebidCache) {
  /**
  * onBeforePosMsg
  * A callback function that gets fired before any cancellable action is requested to be peformed from a a SafeFrame, such as expansion, etc. Return true out of this callback function to cancel/disallow the action in question.
  **/
  function beforePosMsg (posID) {
    console.log('safeframe beforePosMsg', posID)
  }

  /**
  * onPosMsg
  * A callback function that gets fired when an action requested by a SafeFrame is performed
  **/
  function posMsg (posID, type, content) {
    try {
      console.log('safeframe posMsg', posID, type, content)
      if (content === 'ebEmpty' || type === 'error') {
        console.log('safeframe posMsg nuke el:', posID)
        var eleId = posID + '_container'
        if (posID.indexOf('follow') !== -1) {
          eleId = 'fnFollowWrapper_' + posID
        }
        document.getElementById(eleId).innerHTML = '<h1>Intet banner leveret: ' + posID + '</h1>'
        // TODO: NUKE
        // $sf.host.nuke(posID)
        return
      }
      if ((posID === 'monster' || posID === 'wallpaper') && type === 'msg') {
        console.log('safeframe posMsg', content.split('background:')[1])
        var bgCSS = content.split('background:')[1]
        document.getElementById('adtechWallpaper').style.background = bgCSS
      }

      if (type === 'msg' && (posID.indexOf('follow') !== -1 || posID === 'monster' || posID === 'wallpaper')) {
        console.log('safeframe', 'do shit with follow', 'inside if', posID, ebPlacement)
        var eleId = posID + '_container'
        if (posID.indexOf('follow') !== -1) {
          eleId = 'fnFollowWrapper_' + posID
        }
        console.log('safeframe', 'do shit with follow', eleId)
        var regObj = {
          'adType': posID,
          'eleId': eleId
        }
        ebPlacement.skyskraper.register(regObj)
        console.log('safeframe', 'do shit with follow', regObj)
      }
    } catch (err) {
      console.error('safeframe posMsg follow error', err)
    }

      // console.log('safeframe posMsg status', $sf.host.status(posID))
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
    console.log('safeframe onEndPosRender arguments', posID)
    console.log('safeframe onEndPosRender status', $sf.host.status(posID))
    console.log('safeframe onEndPosRender el', document.getElementById(posID + '_trgt'))
  }

  /**
  * safeframes setup for page
  **/
  jppolAdOps.safeframeURL = 'http://ebimg.dk/ux/data/safeframe/safeframe.html?bring=29'
  jppolAdOps.conf = new $sf.host.Config({
    debug: true,
    renderFile: jppolAdOps.safeframeURL,
    onStartPosRender: startPosRender,
    onEndPosRender: endPosRender,
    onBeforePosMsg: beforePosMsg,
    onPosMsg: posMsg
  })

  var adtechKvAdder = function (str, obj) {
    var split_str = str.split(';'),
      strLength = split_str.length,
      obj = obj || {}
    for (var i = strLength - 1; i--;) {
      var kv = split_str[i].replace('kv', ''),
        kvsplit = kv.split('='),
        k = kvsplit[0],
        v = kvsplit[1]
      obj[k] = v
    }
    return obj
  }

  jppolAdOps.adtechKv = {
    rtb: 'false' // We revert the [true/false] value to match the expected value by adtech
  }

  // <%-- criteo . key value --%>
  if (typeof crtg_content !== 'undefined' && crtg_content !== '') {
    jppolAdOps.adtechKv = adtechKvAdder(crtg_content, jppolAdOps.adtechKv)
  }

  // <%-- blue kai . key value --%>
  if (typeof bk_results !== 'undefined' && typeof bk_results.campaigns !== 'undefined') {
    jppolAdOps.adtechKv.bkcmpid = []
    jppolAdOps.adtechKv.bkuuid = []
    for (var i in bk_results.campaigns) {
      jppolAdOps.adtechKv.bkcmpid.push(bk_results.campaigns[i].campaign)
      jppolAdOps.adtechKv.bkuuid.push(bk_results.campaigns[i].bkuuid)
    }

    var metatag = document.createElement('meta')
    metatag.name = ['WS-Custom-Targeting']
    metatag.content = ['bkcmpid='] + jppolAdOps.adtechKv.bkcmpid.join('&') + [';bkuuid='] + jppolAdOps.adtechKv.bkuuid.join('&')
    document.getElementsByTagName('head')[0].appendChild(metatag)
  }

  jppolAdOps.adtechKvArr = []
  for (var key in jppolAdOps.adtechKv) {
    jppolAdOps.adtechKvArr.push('kv' + key + '=' + jppolAdOps.adtechKv[key])
  }

  jppolAdOps.getKeyValues = function (placement) {
    console.log('getKeyValues for runner up:', placement, 'prebidCache', prebidCache, 'adtechKv', jppolAdOps.adtechKvString)
    var bannerKV = []
    if (typeof prebidCache[placement] !== 'undefined' && typeof prebidCache[placement].placementKVoldSchool !== 'undefined') {
      console.log('getKeyValues prebidCache[placement] runner up', prebidCache[placement])
      bannerKV = jppolAdOps.adtechKvArr.concat(prebidCache[placement].placementKVoldSchool)
      console.log('getKeyValues bannerKV after concat', bannerKV)
      // bannerKV = prebidCache[placement].placementKVoldSchool
    } else {
      bannerKV = jppolAdOps.adtechKvArr
    }
    var returnValue = (bannerKV.length > 0) ? bannerKV.join(';') + ';' : ''
    return returnValue
  }

  /**
  * Set up specific banner Position safeframe
  **/
  jppolAdOps.setupFinalPos = function (positionData) {
    /**
    * Setup data sharing
    **/
    var shared_data = {
      banner_position: positionData.id,
      banner_label: positionData.prefixit,
      content_id: positionData.bannerID,
      partner_id: 99
    }
    var private_data_key = 'sfEB'
    var private_data = {
      section_id: 2342,
      site_id: 23904
    }
    var posMeta = new $sf.host.PosMeta(shared_data, private_data_key, private_data)
    console.log('safeframe', 'setupFinalPos', positionData)
    if (typeof positionData.id !== 'undefined') {
      var keyValueString = jppolAdOps.getKeyValues(positionData.id)
      console.log('safeframe', 'so kv for:', positionData.id, 'is', keyValueString)
      var type = (positionData.id.indexOf('follow') !== -1) ? 1489 : 277
      var bannerSrc = 'http://adserver.adtech.de/addyn|3.0|323|' + positionData.bannerID + '|0|' + type + '|ADTECH;loc=100;target=_blank;key=key1+key2+key3+key4;' + keyValueString + 'grp=[group];misc=' + new Date().getTime() // monster
      console.log('safeframe', 'so bannerSrc for:', positionData.id, 'is', bannerSrc, 'with conf', positionData.posConf, 'and meta', posMeta)
      var pos = new $sf.host.Position({
        id: positionData.id,
        src: bannerSrc,
        conf: positionData.posConf,
        meta: posMeta
      })
      $sf.host.render(pos)
    }
  }

  console.log('safeframe init $sf.host.boot()')
}(window.jppolAdOps = window.jppolAdOps || {}, window.ebPlacement = window.ebPlacement || {}, window.prebidCache = window.prebidCache || {}))
