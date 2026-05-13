const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const limit = Math.min(Number(event.limit || 5), 10)

  const baseQuery = db.collection("news")

  let res
  try {
    res = await baseQuery.orderBy("viewCount", "desc").limit(limit).get()
  } catch (e) {
    res = await baseQuery.orderBy("_createTime", "desc").limit(limit).get()
  }

  const list = (res.data || []).map((it) => ({
    _id: it._id,
    title: it.title || "",
    coverImg: it.coverImg || "",
    viewCount: it.viewCount || 0,
    publishDate: it.publishDate || 0,
  }))

  return { list }
}
