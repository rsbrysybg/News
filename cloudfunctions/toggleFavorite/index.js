const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const newsId = event.newsId
  if (!newsId) {
    throw new Error("缺少newsId")
  }

  const existedRes = await db
    .collection("favorites")
    .where({
      _openid: openid,
      newsId,
    })
    .limit(1)
    .get()

  const existed = existedRes.data?.[0]

  if (existed) {
    await db.collection("favorites").doc(existed._id).remove()
    return { isFavorited: false }
  }

  const newsRes = await db.collection("news").doc(newsId).get()
  const news = newsRes.data
  if (!news) {
    throw new Error("新闻不存在")
  }

  await db.collection("favorites").add({
    data: {
      _openid: openid,
      newsId,
      title: news.title || "",
      createTime: Date.now(),
    },
  })

  return { isFavorited: true }
}
