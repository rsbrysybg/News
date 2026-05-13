const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

async function assertAdmin(openid) {
  const res = await db.collection("users").where({ openid }).limit(1).get()
  const user = res.data?.[0]
  if (!user || !user.isAdmin) {
    throw new Error("无管理员权限")
  }
  return user
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  await assertAdmin(wxContext.OPENID)

  const skip = Number(event.skip || 0)
  const limit = Math.min(Number(event.limit || 20), 50)

  const res = await db
    .collection("news")
    .orderBy("publishDate", "desc")
    .skip(skip)
    .limit(limit)
    .get()

  return { list: res.data || [] }
}
