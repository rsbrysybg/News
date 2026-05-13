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

  const name = (event.name || "").trim()
  const sort = Number(event.sort || 0)

  if (!name) {
    throw new Error("名称不能为空")
  }

  const existedRes = await db.collection("categories").where({ name }).limit(1).get()
  const existed = existedRes.data?.[0]

  if (existed) {
    await db.collection("categories").doc(existed._id).update({
      data: {
        sort,
        isActive: existed.isActive !== false,
      },
    })

    return { ok: true, id: existed._id }
  }

  const addRes = await db.collection("categories").add({
    data: {
      name,
      sort,
      isActive: true,
    },
  })

  return { ok: true, id: addRes._id }
}
