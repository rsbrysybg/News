const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 避免重复灌数据：只在 news 为空时初始化
  const newsCountRes = await db.collection("news").count()
  if (newsCountRes.total > 0) {
    return {
      ok: true,
      skipped: true,
      reason: "news 已有数据，跳过初始化",
    }
  }

  // 初始化分类
  const categoryList = [
    { name: "科技", sort: 1, isActive: true },
    { name: "财经", sort: 2, isActive: true },
    { name: "体育", sort: 3, isActive: true },
  ]

  for (const c of categoryList) {
    const existed = await db.collection("categories").where({ name: c.name }).limit(1).get()
    if ((existed.data || []).length === 0) {
      await db.collection("categories").add({ data: c })
    }
  }

  const now = Date.now()
  const demoNews = [
    {
      title: "AI 产业链迎来新一轮增长",
      summary: "从算力到应用落地，AI 正在推动多个行业升级。",
      content:
        "<p>这是一条示例新闻内容。</p><p>你可以在管理端发布页编辑/替换为真实内容。</p>",
      coverImg: "",
      category: "科技",
      author: "示例编辑部",
      viewCount: 0,
      publishDate: now - 3600 * 1000 * 3,
      createdBy: openid,
    },
    {
      title: "市场震荡调整，投资者关注基本面",
      summary: "波动期更需要关注风险控制与资产配置。",
      content:
        "<p>这是一条示例新闻内容。</p><p>你可以在管理端发布页编辑/替换为真实内容。</p>",
      coverImg: "",
      category: "财经",
      author: "示例编辑部",
      viewCount: 0,
      publishDate: now - 3600 * 1000 * 8,
      createdBy: openid,
    },
    {
      title: "联赛焦点战：攻防转换成胜负关键",
      summary: "强强对话中，细节往往决定比赛走势。",
      content:
        "<p>这是一条示例新闻内容。</p><p>你可以在管理端发布页编辑/替换为真实内容。</p>",
      coverImg: "",
      category: "体育",
      author: "示例编辑部",
      viewCount: 0,
      publishDate: now - 3600 * 1000 * 26,
      createdBy: openid,
    },
  ]

  const newsIds = []
  for (const n of demoNews) {
    const addRes = await db.collection("news").add({ data: n })
    newsIds.push(addRes._id)
  }

  // 初始化示例评论（只给第一条新闻加几条）
  if (newsIds[0]) {
    const demoComments = [
      {
        newsId: newsIds[0],
        userInfo: { nickName: "示例用户A", avatarUrl: "" },
        content: "写得不错，继续关注。",
        createTime: now - 1000 * 60 * 15,
        status: 0,
      },
      {
        newsId: newsIds[0],
        userInfo: { nickName: "示例用户B", avatarUrl: "" },
        content: "希望后续能看到更深入的数据。",
        createTime: now - 1000 * 60 * 6,
        status: 0,
      },
    ]

    for (const c of demoComments) {
      await db.collection("comments").add({ data: c })
    }
  }

  return {
    ok: true,
    skipped: false,
    categoryCount: categoryList.length,
    newsCount: demoNews.length,
    newsIds,
  }
}
