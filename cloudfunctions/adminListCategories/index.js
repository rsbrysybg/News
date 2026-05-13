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

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  await assertAdmin(wxContext.OPENID)

  const res = await db.collection("categories").orderBy("sort", "asc").get()

  const list = (res.data || []).map((it) => ({
    _id: it._id,
    name: it.name,
    sort: it.sort || 0,
    isActive: it.isActive !== false,
  }))

  return { list }
}
