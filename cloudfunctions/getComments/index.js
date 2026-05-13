const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const newsId = event.newsId
  if (!newsId) {
    throw new Error("缺少newsId")
  }

  const res = await db
    .collection("comments")
    .where({
      newsId,
      // 0=已上架(兼容历史)，1=已下架，2=待审核
      status: 0,
    })
    .orderBy("createTime", "desc")
    .limit(50)
    .get()

  return {
    list: res.data || [],
  }
}
