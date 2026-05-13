Page({
  data: {
    form: {
      name: "",
      sort: 0,
    },
    saving: false,
    loading: false,
    list: [],
  },

  onShow() {
    this.loadList()
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k
    const v = e.detail.value
    this.setData({ [`form.${k}`]: v })
  },

  async onSave() {
    const name = (this.data.form.name || "").trim()
    const sort = Number(this.data.form.sort || 0)

    if (!name) {
      wx.showToast({ title: "名称不能为空", icon: "none" })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true })

    try {
      await wx.cloud.callFunction({
        name: "adminUpsertCategory",
        data: { name, sort },
      })
      wx.showToast({ title: "已保存", icon: "none" })
      this.setData({ form: { name: "", sort: 0 } })
      this.loadList()
    } catch (e) {
      wx.showToast({ title: "保存失败/无权限", icon: "none" })
    } finally {
      this.setData({ saving: false })
    }
  },

  async loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({ name: "adminListCategories" })
      const list = res?.result?.list || []
      this.setData({ list })
    } catch (e) {
      wx.showToast({ title: "无权限或加载失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },

  async toggleActive(e) {
    const id = e.currentTarget.dataset.id
    const active = !!e.currentTarget.dataset.active
    if (!id) return

    try {
      await wx.cloud.callFunction({
        name: "adminSetCategoryActive",
        data: { id, isActive: !active },
      })
      wx.showToast({ title: !active ? "已启用" : "已停用", icon: "none" })
      this.loadList()
    } catch (e) {
      wx.showToast({ title: "操作失败/无权限", icon: "none" })
    }
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    if (!id || !name) return

    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "确认删除",
        content: `确定删除栏目「${name}」吗？该栏目下新闻将自动回退到「推荐」。`,
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
        name: "adminDeleteCategory",
        data: { id, name },
      })
      wx.hideLoading()
      wx.showToast({ title: "已删除", icon: "none" })
      this.loadList()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: "删除失败/无权限", icon: "none" })
    }
  },
})
