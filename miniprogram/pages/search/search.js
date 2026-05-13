const PAGE_SIZE = 10

Page({
  data: {
    keyword: "",
    newsList: [],
    loading: false,
    hasMore: true,
    skip: 0,
  },

  onLoad(query) {
    const keyword = decodeURIComponent(query.keyword || "")
    this.setData({ keyword })
    this.loadNews(true)
  },

  onPullDownRefresh() {
    this.loadNews(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadNews(false)
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async loadNews(reset) {
    if (this.data.loading) return

    const skip = reset ? 0 : this.data.skip
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: "getNewsList",
        data: {
          category: "",
          keyword: this.data.keyword,
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
