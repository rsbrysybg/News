const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const id = event.id
  if (!id) {
    throw new Error("缺少id")
  }

  const docRes = await db.collection("news").doc(id).get()
  const detail = docRes.data || null

  let isFavorited = false
  if (detail) {
    const favRes = await db
      .collection("favorites")
      .where({
        _openid: openid,
        newsId: id,
      })
      .limit(1)
      .get()

    isFavorited = (favRes.data || []).length > 0
  }

  return {
    detail,
    isFavorited,
  }
}
