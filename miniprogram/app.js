App({
  globalData: {
    openid: "",
    userInfo: null,
  },
  onLaunch() {
    if (!wx.cloud) {
      wx.showToast({ title: "请使用支持云开发的基础库", icon: "none" })
      return
    }

    wx.cloud.init({
      traceUser: true,
    })

    wx.cloud
      .callFunction({
        name: "login",
      })
      .then((res) => {
        this.globalData.openid = res?.result?.openid || ""
      })
      .catch(() => {
        wx.showToast({ title: "登录失败", icon: "none" })
      })
  },
})
