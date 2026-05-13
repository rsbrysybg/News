Component({
  data: {
    selected: 0,
  },
  methods: {
    onSwitch(e) {
      const path = e.currentTarget.dataset.path
      const index = Number(e.currentTarget.dataset.index || 0)
      this.setData({ selected: index })
      if (path) {
        wx.switchTab({ url: `/${path}` })
      }
    },
  },
})
