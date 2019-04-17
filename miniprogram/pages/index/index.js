//index.js
const app = getApp()

Page({
  data: {
    windowWidth: 0,
    windowHeight: 0,
    mapWidth: 0,
    mapHeight: 0,
    tileSize: 256,
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    mapList: [
      //'https://img.lorenzodc.com/maps/2/0_0.png',
      //'https://img.lorenzodc.com/maps/2/1_0.png',
      //'https://img.lorenzodc.com/maps/2/2_0.png',
      //'https://img.lorenzodc.com/maps/2/3_0.png',
    ],
    styleList: [
      //'width: 100px; height:100px;',
      //'width: 100px; height:100px;',
      //'width: 100px; height:100px;',
      //'width: 100px; height:100px;',
    ],
    mapInfo: {
      mapDetail: [
        {
          dir: 2,
          scale: 1,
          xSize: 4,
          ySize: 4,
          xStart: 136,
          yStart: 200,
          xEnd: 118,
          yEnd: 57
        }, {
          dir: 3,
          scale: 1.5,
          xSize: 6,
          ySize: 6,
          xStart: 18,
          yStart: 144,
          xEnd: 238,
          yEnd: 114
        },{
          dir: 4,
          scale: 4,
          xSize: 12,
          ySize: 10,
          xStart: 36,
          yStart: 30,
          xEnd: 220,
          yEnd: 226
        }, {
          dir: 5,
          scale: 8,
          xSize: 24,
          ySize: 20,
          xStart: 72,
          yStart: 60,
          xEnd: 184,
          yEnd: 196
        }, {
          dir: 6,
          scale: 16,
          xSize: 48,
          ySize: 40,
          xStart: 144,
          yStart: 120,
          xEnd: 112,
          yEnd: 136
        }, {
          dir: 7,
          scale: 4,
          xSize: 94,
          ySize: 80,
          xStart: 32,
          yStart: 240,
          xEnd: 224,
          yEnd: 16
        }
      ],
      lambda: 1,
      mapWidth: 750,
      mapHeight: 625,
      scale: 1,
      minScale: 1,
      maxScale: 32,
      centerX: 375.0,
      centerY: 312.5,
    },
    touch: {
      xStart: 0,
      yStart: 0,
      xStartCenter: 0,
      yStartCenter: 0,
      xEnd: 0,
      yEnd: 0,
      xEndCenter: 0,
      yEndCenter: 0,
      distance: 1,
      dist: 1,
    }
  },

  onLoad: function () {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    var that = this
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight,
          mapWidth: res.windowWidth,
          mapHeight: res.windowWidth * 625 / 750,
        });
      }
    })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },

  onGetUserInfo: function (e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onShow(e) {
    this.initMap()
  },

  touchstartCallback: function (e) {
    // console.log(e)
    if (e.touches.length == 1) {
      // record finger coordinate
      this.setData({
        'touch.xStart': e.touches[0].pageX,
        'touch.yStart': e.touches[0].pageY
      })
    } else {
      console.log(e.touches)
      // record finger distance and center
      let xMove = e.touches[1].pageX - e.touches[0].pageX
      let yMove = e.touches[1].pageY - e.touches[0].pageY
      let xStartCenter = (e.touches[1].clientX + e.touches[0].clientX) / 2
      let yStartCenter = (e.touches[1].clientY + e.touches[0].clientY) / 2
      let distance = Math.sqrt(xMove * xMove + yMove * yMove)
      this.setData({
        'touch.distance': distance,
        'touch.xStartCenter': xStartCenter,
        'touch.yStartCenter': yStartCenter,
      })
    }
  },

  touchmoveCallback: function (e) {
    // console.log(e)
    if (e.touches.length == 1) {
      // if (this.data.mapInfo.scale == 1) return
      // update finger coordinate
      this.setData({
        'touch.xEnd': e.touches[0].pageX,
        'touch.yEnd': e.touches[0].pageY
      })
    } else {
      // update finger distance
      let xMove = e.touches[1].pageX - e.touches[0].pageX
      let yMove = e.touches[1].pageY - e.touches[0].pageY
      let xStartCenter = (e.touches[1].clientX + e.touches[0].clientX) / 2
      let yStartCenter = (e.touches[1].clientY + e.touches[0].clientY) / 2
      let dist = Math.sqrt(xMove * xMove + yMove * yMove)
      this.setData({
        'touch.dist': dist,
        'touch.xStartCenter': xStartCenter,
        'touch.yStartCenter': yStartCenter,
      })
    }
  },
  touchendCallback: function (e) {
    //console.log(e)
    this.updateCenter()
    this.updateScale()
    this.resetTouch()
    this.drawMap()
  },
  resetTouch: function () {
    this.setData({
      'touch.xStart': 0,
      'touch.yStart': 0,
      'touch.xStartCenter': 0,
      'touch.yStartCenter': 0,
      'touch.xEnd': 0,
      'touch.yEnd': 0,
      'touch.xEndCenter': 0,
      'touch.yEndCenter': 0,
      'touch.distance': 1,
      'touch.dist': 1
    })
  },
  updateCenter: function () {
    console.log(this.data.touch)
    let scale = this.data.mapInfo.scale
    let xMove = this.data.touch.xEnd - this.data.touch.xStart
    let yMove = this.data.touch.yEnd - this.data.touch.yStart
    // use sqrt to move faster
    let newCenterX = this.data.mapInfo.centerX - xMove / Math.sqrt(scale)
    let newCenterY = this.data.mapInfo.centerY - yMove / Math.sqrt(scale)
    if (this.data.touch.xStartCenter != 0 && this.data.touch.yStartCenter !=0) {
      //let lambda = this.data.mapWidth / this.data.windowWidth / scale
      //xMove = this.data.touch.xStartCenter - this.data.mapWidth / 2
      //yMove = this.data.touch.yStartCenter - this.data.mapHeight / 2
      //newCenterX = this.data.mapInfo.centerX - xMove * lambda
      //newCenterY = this.data.mapInfo.centerY - yMove * lambda
      console.log(scale, this.data.mapInfo.centerX, this.data.mapInfo.centerY, this.data.touch.xStartCenter, this.data.touch.yStartCenter, this.data.mapWidth, this.data.mapHeight)

    }
    console.log(scale, xMove, yMove, this.data.mapInfo.centerX, this.data.mapInfo.centerY, newCenterX, newCenterY)
    this.setData({
      'mapInfo.centerX': newCenterX,
      'mapInfo.centerY': newCenterY
    })
  },
  updateScale: function () {
    let distance = this.data.touch.distance
    let dist = this.data.touch.dist
    // console.log(dist, distance)
    let scale = this.data.mapInfo.scale * dist / distance
    // console.log(dist, distance, scale)
    if (scale < this.data.mapInfo.minScale)
      scale = this.data.mapInfo.minScale
    if (scale > this.data.mapInfo.maxScale)
      scale = this.data.mapInfo.maxScale
    this.setData({
      'mapInfo.scale': scale
    })
  },

  drawMap: function () {
    if (this.data.mapInfo.scale == 1) {
      this.initMap()
    }
    let windowWidth = this.data.windowWidth
    let mapWidth = this.data.mapInfo.mapWidth
    let mapHeight = this.data.mapInfo.mapHeight
    let tileSize = this.data.tileSize
    let centerX = this.data.mapInfo.centerX
    let centerY = this.data.mapInfo.centerY
    let scale = this.data.mapInfo.scale
    let mapDetail = this.data.mapInfo.mapDetail[0]
    for (var i = 0; i < this.data.mapInfo.mapDetail.length; i++) {
      if (scale > this.data.mapInfo.mapDetail[i].scale)
        mapDetail = this.data.mapInfo.mapDetail[i]
    }
    console.log(mapDetail)
    let mapScale = mapDetail.scale
    if (scale > 32)
      scale = 32 
    let lambda = mapWidth / windowWidth / scale * mapDetail.scale
    let left = centerX - mapWidth / scale / 2
    let right = centerX + mapWidth / scale / 2
    let top = centerY - mapHeight / scale / 2
    let bottom = centerY + mapHeight / scale / 2
    console.log(scale, centerX, centerY, left, right, top, bottom)
    if (left < 0) {
      right -= left
      left = 0
      centerX = left + mapWidth / scale / 2
    }
    if (right > mapWidth) {
      left -= right - mapWidth
      right = mapWidth
      centerX = right - mapWidth / scale / 2
    }
    if (top < 0) {
      bottom -= top
      top = 0
      centerY = top + mapHeight / scale / 2
    }
    if (bottom > mapHeight) {
      top -= bottom - mapHeight
      bottom = mapHeight
      centerY = bottom - mapHeight / scale / 2
    }
    this.setData({
      'mapInfo.centerX': centerX,
      'mapInfo.centerY': centerY
    })
    let xStart = Math.floor((left * mapScale + mapDetail.xStart) / tileSize)
    let xEnd = Math.floor((right * mapScale + mapDetail.xStart)/ tileSize)
    let yStart = Math.floor((top * mapScale + mapDetail.yStart) / tileSize)
    let yEnd = Math.floor((bottom * mapScale + mapDetail.yStart) / tileSize)
    console.log(scale, centerX, centerY, left, right, top, bottom)
    console.log(xStart, xEnd, yStart, yEnd)
    var imgList = []
    var cssList = []
    for (let i = xStart; i <= xEnd; i++) {
      for (let j = yStart; j <= yEnd; j++) {
        var imgUrl = 'https://img.lorenzodc.com/maps/' + mapDetail.dir + '/' + i + '_' + j + '.png'
        imgList.push(imgUrl)
        let l = mapScale * left + mapDetail.xStart - i * tileSize
        let r = mapScale * right + mapDetail.xStart - i * tileSize
        let t = mapScale * top + mapDetail.yStart - j * tileSize
        let b = mapScale * bottom + mapDetail.yStart - j * tileSize
        let pleft = Math.floor(-l / lambda)
        let ptop = Math.floor(-t / lambda)
        let size = Math.floor(tileSize / lambda)
        l = Math.floor((l > 0 ? l : 0) / lambda)
        r = Math.ceil((r > tileSize ? tileSize : r) / lambda)
        t = Math.floor((t > 0 ? t : 0) / lambda)
        b = Math.ceil((b > tileSize ? tileSize : b) / lambda)
        var css = 'position:absolute; width:' + size + 'px; height:' + size + 'px;left:' + pleft + 'px;top:' + ptop + 'px;clip:rect(' + t + 'px,' + r + 'px,' + b + 'px, ' + l + 'px)'
        cssList.push(css)
      }
    }
    //console.log(imgList, cssList)
    this.setData({
      mapList: imgList,
      styleList: cssList
    })
  },

  initMap: function () {
    let mapDetail = this.data.mapInfo.mapDetail[0]
    let lambda = this.data.mapInfo.mapWidth / this.data.windowWidth * mapDetail.scale
    let tileSize = this.data.tileSize
    var imgList = []
    var cssList = []
    for (var i = 0; i < mapDetail.xSize; i++) {
      for (var j = 0; j < mapDetail.ySize; j++) {
        var imgUrl = 'https://img.lorenzodc.com/maps/' + mapDetail.dir + '/' + i + '_' + j + '.png'
        imgList.push(imgUrl)
        let l = mapDetail.scale * 0 + mapDetail.xStart - i * tileSize
        let r = mapDetail.scale * 750 + mapDetail.xStart - i * tileSize
        let t = mapDetail.scale * 0 + mapDetail.yStart - j * tileSize
        let b = mapDetail.scale * 625 + mapDetail.yStart - j * tileSize
        let left = Math.floor(-l / lambda)
        let top = Math.floor(-t / lambda)
        let size = Math.floor(tileSize / lambda)
        l = Math.floor((l > 0 ? l : 0) / lambda)
        r = Math.ceil((r > tileSize ? tileSize : r) / lambda)
        t = Math.floor((t > 0 ? t : 0) / lambda)
        b = Math.ceil((b > tileSize ? tileSize : b) / lambda)
        var css = 'position:absolute; width:' + size + 'px; height:' + size + 'px;left:' + left + 'px;top:' + top + 'px;clip:rect(' + t + 'px,' + r + 'px,' + b + 'px, ' + l + 'px)'
        cssList.push(css)
      }
    }
    this.setData({
      mapList: imgList,
      styleList: cssList
    })
  }
})