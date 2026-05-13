const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const res = await db
    .collection("favorites")
    .where({ _openid: openid })
    .orderBy("createTime", "desc")
    .limit(50)
    .get()

  return { list: res.data || [] }
}
