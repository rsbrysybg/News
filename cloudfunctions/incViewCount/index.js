const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const newsId = event.newsId
  if (!newsId) {
    throw new Error("缺少newsId")
  }

  await db
    .collection("news")
    .doc(newsId)
    .update({
      data: {
        viewCount: _.inc(1),
      },
    })

  return { ok: true }
}
