const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const res = await db.collection("users").where({ openid }).limit(1).get()
  const user = res.data?.[0] || null

  return {
    user,
    isAdmin: !!user?.isAdmin,
  }
}
