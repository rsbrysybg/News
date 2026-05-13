const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const nickName = (event.nickName || "").trim()
  const avatarUrl = (event.avatarUrl || "").trim()

  const res = await db.collection("users").where({ openid }).limit(1).get()
  const existed = res.data?.[0]

  if (existed) {
    await db.collection("users").doc(existed._id).update({
      data: {
        nickName: nickName || existed.nickName || "用户",
        avatarUrl: avatarUrl || existed.avatarUrl || "",
      },
    })
    return { ok: true }
  }

  await db.collection("users").add({
    data: {
      openid,
      nickName: nickName || "用户",
      avatarUrl: avatarUrl || "",
      isAdmin: false,
      joinTime: Date.now(),
    },
  })

  return { ok: true }
}
