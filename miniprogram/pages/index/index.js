const PAGE_SIZE = 10

Page({
  data: {
    categories: [{ name: "推荐" }],
    activeCategory: "推荐",
    keyword: "",
    topReadList: [],
    newsList: [],
    loading: false,
    hasMore: true,
    skip: 0,
  },

  onLoad() {
    this.loadCategories()
    this.loadTopReadNews()
    this.loadNews(true)
  },

  onShow() {
    // 自定义 tabBar 选中态同步
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onPullDownRefresh() {
    this.loadNews(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadNews(false)
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    const keyword = (this.data.keyword || "").trim()
    if (!keyword) {
      wx.showToast({ title: "请输入关键词", icon: "none" })
      return
    }
    wx.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}` })
  },

  onTabTap(e) {
    const name = e.currentTarget.dataset.name
    if (!name || name === this.data.activeCategory) return
    this.setData({ activeCategory: name })
    this.loadNews(true)
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onTapTopRead(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async loadCategories() {
    try {
      const res = await wx.cloud.callFunction({ name: "getCategories" })
      const list = res?.result?.list || []
      if (Array.isArray(list) && list.length > 0) {
        this.setData({ categories: [{ name: "推荐" }, ...list] })
      }
    } catch (e) {
      // 忽略分类加载失败，保留默认“推荐”
    }
  },

  async loadTopReadNews() {
    try {
      const res = await wx.cloud.callFunction({
        name: "getTopReadNews",
        data: { limit: 5 },
      })
      const list = res?.result?.list || []
      const filtered = (Array.isArray(list) ? list : []).filter((it) => !!it.coverImg)
      this.setData({ topReadList: filtered })
    } catch (e) {
      // ignore
    }
  },

  async loadNews(reset) {
    if (this.data.loading) return

    const skip = reset ? 0 : this.data.skip
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: "getNewsList",
        data: {
          category: this.data.activeCategory,
          keyword: "",
          skip,
          limit: PAGE_SIZE,
        },
      })

      const list = res?.result?.list || []
      const normalized = list.map((it) => {
        const publishDate = it.publishDate || 0
        return {
          ...it,
          publishDateText: publishDate ? this.formatDate(publishDate) : "",
          viewCount: it.viewCount || 0,
        }
      })

      const merged = reset ? normalized : this.data.newsList.concat(normalized)

      this.setData({
        newsList: merged,
        skip: merged.length,
        hasMore: normalized.length === PAGE_SIZE,
      })
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },

  formatDate(ts) {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  },
})
