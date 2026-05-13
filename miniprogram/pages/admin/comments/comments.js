Page({
  data: {
    loading: false,
    list: [],
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: "adminListComments",
        data: { limit: 50 },
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
      this.setData({ list: normalized })
    } catch (e) {
      wx.showToast({ title: "无权限或加载失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },

  async deleteComment(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "确认删除",
        content: "确定删除该评论吗？删除后不可恢复。",
        confirmText: "删除",
        cancelText: "取消",
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      })
    })

    if (!confirm) return

    try {
      wx.showLoading({ title: "删除中..." })
      await wx.cloud.callFunction({
        name: "adminDeleteComment",
        data: { id },
      })
      wx.hideLoading()
      wx.showToast({ title: "已删除", icon: "none" })
      this.loadList()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: "删除失败/无权限", icon: "none" })
    }
  },

  async upComment(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    try {
      await wx.cloud.callFunction({
        name: "adminSetCommentStatus",
        data: { id, status: 0 },
      })
      wx.showToast({ title: "已上架", icon: "none" })
      this.loadList()
    } catch (err) {
      wx.showToast({ title: "操作失败/无权限", icon: "none" })
    }
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
