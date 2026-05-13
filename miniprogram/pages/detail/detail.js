Page({
  data: {
    id: "",
    detail: {},
    contentNodes: "",
    isFavorited: false,
    comments: [],
    loadingComments: false,
    commentText: "",
  },

  onLoad(query) {
    const id = query.id
    this.setData({ id })
    this.loadDetail()
    this.incViewCount()
    this.loadComments()
  },

  onShow() {
    // 返回详情页时刷新收藏状态/评论
    if (this.data.id) {
      this.loadDetail(true)
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async loadDetail(quiet) {
    try {
      const res = await wx.cloud.callFunction({
        name: "getNewsDetail",
        data: { id: this.data.id },
      })
      const detail = res?.result?.detail || {}
      const isFavorited = !!res?.result?.isFavorited
      const publishDate = detail.publishDate || 0

      this.setData({
        detail: {
          ...detail,
          viewCount: detail.viewCount || 0,
          publishDateText: publishDate ? this.formatDate(publishDate) : "",
        },
        contentNodes: this.normalizeRichText(detail.content || ""),
        isFavorited,
      })
    } catch (e) {
      if (!quiet) {
        wx.showToast({ title: "加载详情失败", icon: "none" })
      }
    }
  },

  async incViewCount() {
    try {
      await wx.cloud.callFunction({
        name: "incViewCount",
        data: { newsId: this.data.id },
      })
    } catch (e) {
      // 忽略阅读量失败
    }
  },

  async onToggleFavorite() {
    try {
      const res = await wx.cloud.callFunction({
        name: "toggleFavorite",
        data: { newsId: this.data.id },
      })
      const isFavorited = !!res?.result?.isFavorited
      this.setData({ isFavorited })
      wx.showToast({ title: isFavorited ? "已收藏" : "已取消", icon: "none" })
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  async loadComments() {
    if (this.data.loadingComments) return
    this.setData({ loadingComments: true })

    try {
      const res = await wx.cloud.callFunction({
        name: "getComments",
        data: { newsId: this.data.id },
      })
      const list = res?.result?.list || []
      const normalized = list.map((it) => ({
        ...it,
        createTimeText: it.createTime ? this.formatDateTime(it.createTime) : "",
        userInfo: {
          nickName: it.userInfo?.nickName || "用户",
          avatarUrl: it.userInfo?.avatarUrl || "",
        },
      }))
      this.setData({ comments: normalized })
    } catch (e) {
      wx.showToast({ title: "评论加载失败", icon: "none" })
    } finally {
      this.setData({ loadingComments: false })
    }
  },

  async onSendComment() {
    const content = (this.data.commentText || "").trim()
    if (!content) {
      wx.showToast({ title: "请输入评论", icon: "none" })
      return
    }

    try {
      await wx.cloud.callFunction({
        name: "addComment",
        data: {
          newsId: this.data.id,
          content,
        },
      })
      this.setData({ commentText: "" })
      wx.showToast({ title: "已提交，等待审核", icon: "none" })
      this.loadComments()
    } catch (e) {
      wx.showToast({ title: "发送失败", icon: "none" })
    }
  },

  normalizeRichText(content) {
    if (!content) return ""
    if (typeof content !== "string") {
      try {
        return JSON.stringify(content)
      } catch (e) {
        return ""
      }
    }

    // 纯文本简单处理为html
    if (!content.includes("<")) {
      return content.replace(/\n/g, "<br/>")
    }

    return content
  },

  formatDate(ts) {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
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
