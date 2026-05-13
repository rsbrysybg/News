const app = getApp()

Page({
  data: {
    userInfo: {
      nickName: "未授权",
      avatarUrl: "",
    },
    hasLogin: false,
    openidShort: "",
    isAdmin: false,
    favorites: [],
    loadingFav: false,
  },

  onShow() {
    // 自定义 tabBar 选中态同步
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }

    this.loadProfile()
    this.loadFavorites()
  },

  async onInitDemoData() {
    try {
      wx.showLoading({ title: "初始化中..." })
      const res = await wx.cloud.callFunction({ name: "initDemoData" })
      const skipped = !!res?.result?.skipped
      wx.hideLoading()

      wx.showToast({
        title: skipped ? "已存在数据，已跳过" : "初始化成功",
        icon: "none",
      })

      // 跳回首页让你直接看到列表
      setTimeout(() => {
        wx.switchTab({ url: "/pages/index/index" })
      }, 600)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: "初始化失败", icon: "none" })
    }
  },

  async loadProfile() {
    try {
      const res = await wx.cloud.callFunction({ name: "getMyProfile" })
      const user = res?.result?.user || null
      const isAdmin = !!res?.result?.isAdmin
      const openid = user?.openid || app?.globalData?.openid || ""

      const nickName = user?.nickName || ""
      const avatarUrl = user?.avatarUrl || ""
      const hasLogin = !!(nickName && nickName !== "用户" && nickName !== "未授权")

      this.setData({
        userInfo: {
          nickName: nickName || "未授权",
          avatarUrl: avatarUrl || "",
        },
        hasLogin,
        isAdmin,
        openidShort: openid ? `${openid.slice(0, 6)}...${openid.slice(-6)}` : "",
      })
    } catch (e) {
      // 忽略
    }
  },

  async onLogin() {
    try {
      const res = await wx.getUserProfile({ desc: "用于展示头像昵称" })
      const userInfo = res.userInfo

      await wx.cloud.callFunction({
        name: "updateUserProfile",
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
        },
      })

      this.setData({
        userInfo: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
        },
        hasLogin: true,
      })

      wx.showToast({ title: "登录成功", icon: "none" })
    } catch (e) {
      wx.showToast({ title: "登录失败", icon: "none" })
    }
  },

  async loadFavorites() {
    if (this.data.loadingFav) return
    this.setData({ loadingFav: true })

    try {
      const res = await wx.cloud.callFunction({ name: "getFavorites" })
      const list = res?.result?.list || []
      const normalized = list.map((it) => ({
        ...it,
        createTimeText: it.createTime ? this.formatDateTime(it.createTime) : "",
      }))
      this.setData({ favorites: normalized })
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" })
    } finally {
      this.setData({ loadingFav: false })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goPublish() {
    wx.navigateTo({ url: "/pages/admin/publish/publish" })
  },

  goAdminComments() {
    wx.navigateTo({ url: "/pages/admin/comments/comments" })
  },

  goAdminCategory() {
    wx.navigateTo({ url: "/pages/admin/category/category" })
  },

  formatDateTime(ts) {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${day} ${hh}:${mm}`
  },
})
