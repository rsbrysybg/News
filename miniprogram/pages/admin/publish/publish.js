const PAGE_SIZE = 20

Page({
  data: {
    activeSection: "create",
    categories: [],
    categoryNames: ["推荐"],
    categoryIndex: 0,

    form: {
      _id: "",
      title: "",
      author: "",
      summary: "",
      content: "",
      coverImg: "",
      category: "推荐",
    },

    saving: false,
    loadingList: false,
    newsList: [],
  },

  onLoad(query) {
    this.loadCategories()
    this.loadNewsList()

    if (query.id) {
      this.setData({ activeSection: "create" })
      this.loadForEdit(query.id)
    }
  },

  switchSection(e) {
    const k = e.currentTarget.dataset.k
    if (!k) return
    this.setData({ activeSection: k })
  },

  async loadCategories() {
    try {
      const res = await wx.cloud.callFunction({ name: "getCategories" })
      const list = res?.result?.list || []
      const names = ["推荐"].concat(list.map((it) => it.name).filter(Boolean))
      this.setData({ categories: list, categoryNames: names })
    } catch (e) {
      // ignore
    }
  },

  async loadNewsList() {
    if (this.data.loadingList) return
    this.setData({ loadingList: true })

    try {
      const res = await wx.cloud.callFunction({
        name: "adminListNews",
        data: { skip: 0, limit: PAGE_SIZE },
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
      this.setData({ newsList: normalized })
    } catch (e) {
      wx.showToast({ title: "无权限或加载失败", icon: "none" })
    } finally {
      this.setData({ loadingList: false })
    }
  },

  async loadForEdit(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: "getNewsDetail",
        data: { id },
      })
      const detail = res?.result?.detail
      if (!detail) {
        wx.showToast({ title: "新闻不存在", icon: "none" })
        return
      }

      const names = this.data.categoryNames
      const idx = Math.max(0, names.indexOf(detail.category || "推荐"))

      this.setData({
        activeSection: "create",
        form: {
          _id: detail._id,
          title: detail.title || "",
          author: detail.author || "",
          summary: detail.summary || "",
          content: detail.content || "",
          coverImg: detail.coverImg || "",
          category: detail.category || "推荐",
        },
        categoryIndex: idx,
      })
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k
    const v = e.detail.value
    this.setData({ [`form.${k}`]: v })
  },

  onCategoryChange(e) {
    const idx = Number(e.detail.value || 0)
    const name = this.data.categoryNames[idx] || "推荐"
    this.setData({ categoryIndex: idx, "form.category": name })
  },

  async chooseCover() {
    try {
      const chooseRes = await wx.chooseImage({ count: 1 })
      const filePath = chooseRes.tempFilePaths?.[0]
      if (!filePath) return

      wx.showLoading({ title: "上传中..." })
      const cloudPath = `news_covers/${Date.now()}_${Math.random().toString(16).slice(2)}.jpg`
      const upRes = await wx.cloud.uploadFile({ cloudPath, filePath })
      this.setData({ "form.coverImg": upRes.fileID })
    } catch (e) {
      wx.showToast({ title: "选择/上传失败", icon: "none" })
    } finally {
      wx.hideLoading()
    }
  },

  async onSave() {
    const f = this.data.form
    const title = (f.title || "").trim()
    const content = (f.content || "").trim()

    if (!title) {
      wx.showToast({ title: "标题不能为空", icon: "none" })
      return
    }
    if (!content) {
      wx.showToast({ title: "正文不能为空", icon: "none" })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true })

    try {
      await wx.cloud.callFunction({
        name: "adminUpsertNews",
        data: {
          id: f._id || "",
          title,
          author: (f.author || "").trim(),
          summary: (f.summary || "").trim(),
          content,
          coverImg: f.coverImg || "",
          category: f.category || "推荐",
        },
      })

      wx.showToast({ title: "已保存", icon: "none" })
      this.onCancelEdit()
      this.loadNewsList()
      this.setData({ activeSection: "manage" })
    } catch (e) {
      wx.showToast({ title: "保存失败/无权限", icon: "none" })
    } finally {
      this.setData({ saving: false })
    }
  },

  onCancelEdit() {
    this.setData({
      form: {
        _id: "",
        title: "",
        author: "",
        summary: "",
        content: "",
        coverImg: "",
        category: "推荐",
      },
      categoryIndex: 0,
    })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    this.setData({ activeSection: "create" })
    this.loadForEdit(id)
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "确认删除",
        content: "删除后不可恢复",
        success: (r) => resolve(!!r.confirm),
        fail: () => resolve(false),
      })
    })

    if (!confirm) return

    try {
      await wx.cloud.callFunction({
        name: "adminDeleteNews",
        data: { id },
      })
      wx.showToast({ title: "已删除", icon: "none" })
      this.loadNewsList()
    } catch (e) {
      wx.showToast({ title: "删除失败/无权限", icon: "none" })
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
