# sharedsafeframes
JPPol shared safeframes implementation

# Table of Contents
1. [Host side setup](#host-side)
2. [Calling banner](#calling-banner)

# Host side
Include jppolhost.min.js in page
Creates an object called jppolAdOps, with the following exposed elements

* [safeframeInit](#safeframeInit)
* [setupFinalPos](#setupFinalPos)


# Initialize JPPol Safeframes from publisher site
## safeframeInit
* function

The initialize function takes an object as argument, with [safeframeURL](#safeframeURL) and [adtechNetworkId](#adtechNetworkId) as mandatory settings

Initialize function
``` js
  var sfOptions = {
    safeframeURL: '//ebimg.dk/ux/data/safeframes/index.html',
    adtechNetworkId: '123'
  }
  jppolAdOps.safeframeInit(sfOptions)
```

## Options

### safeframeURL
* Mandatory [string]

Set the URL of were the safeframe HTML file is placed

setup example
```js
  var sfOptions = {
    safeframeURL: '//ebimg.dk/ux/data/safeframes/index.html'
  }
```

### adtechNetworkId
* Mandatory [string / object]
Set the ADTECH network id, can be passed as an object to differentiate between network ids based on [device type](#device)

String setup example
```js
  var sfOptions = {
    adtechNetworkId: '123'
  }
```

Device Object setup example
```js
  var sfOptions = {
    adtechNetworkId: {
      desktop: '123',
      smartphone: '123.0',
      tablet: '123'
    }
  }
```

### baseBannerSrc
* Optional [string / object]
* default: '//adserver.adtech.de/addyn/3.0/'
Set the base banner url, from which the final banner script src will be build, can be passed as an object to differentiate between network ids based on [device type](#device)

String setup example
```js
  var sfOptions = {
    baseBannerSrc: '//adserver.adtech.de/addyn/3.0/'
  }
```

Device Object setup example
```js
  var sfOptions = {
    adtechNetworkId: {
      desktop: '123',
      smartphone: '123.0',
      tablet: '123'
    }
  }
```


### device
* Optional [string]
* default: 'desktop'
Set current device type, used to differentiate adtechNetworkId and baseBannerSrc

Setup example
```js
  var sfOptions = {
    device: 'desktop'
  }
```

### messageCallback
* Optional [function]
Set the function which should be called when the safeframe is triggering onPosMsg

An object[example shown below] is passed as argument to the callback function containing 4

Argument example
``` js
var messageObject = {
  'placement': 'string', // string
  'type': 'string', // ['msg'/'error']
  'content': 'string', //
  'nuked': nuked
}
```

Init setup example
```js
  var sfOptions = {
    onPosMsg: handleCallBack
  }
```

### wallpaper

#### wallpaperHandler
* Optional [boolean]
* default: false

Should be set to true if wallpaper is an option on the page, usually only for desktop devices

example
```js
  var sfOptions = {
    wallpaperHandler: true
  }
```

#### wallpaperSelector
* Optional [string]

Can be body or regular CSS selector / ID

example
```js
  var sfOptions = {
    wallpaperSelector: 'adtechWallpaper'
  }
```

#### wallpaperPositions
* Optional [Array / string]

Name of positions of which to check for wallpaper.

example
```js
  var sfOptions = {
    wallpaperPositions: ['wallpaper','monster']
  }
```

### allowNuke
* Optional [boolean]
* default: true

If for some reason you wouldn't wan't the banner to collapse if no banner is loaded

example
```js
  var sfOptions = {
    allowNuke: true
  }
```

### debug
* Optional [boolean]
* default: false

For debugging purposes

example
```js
  var sfOptions = {
    debug: false
  }
```

# Calling banner
## setupFinalPos
* function

positionData


## Passing data to banner

There is two ways to pass data to safeframes, one public and one private.


privateDataOptions
