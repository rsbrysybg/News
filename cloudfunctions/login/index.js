const cloud = require("wx-server-sdk")

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database()
  const openid = wxContext.OPENID

  // 启动即确保 users 有一条基础记录（不依赖用户点授权）
  const res = await db.collection("users").where({ openid }).limit(1).get()
  const existed = res.data?.[0]

  if (existed) {
    // 补全 joinTime 等字段，避免早期老数据缺字段
    await db.collection("users").doc(existed._id).update({
      data: {
        joinTime: existed.joinTime || Date.now(),
        isAdmin: !!existed.isAdmin,
        openid,
      },
    })
  } else {
    await db.collection("users").add({
      data: {
        openid,
        nickName: "用户",
        avatarUrl: "",
        isAdmin: false,
        joinTime: Date.now(),
      },
    })
  }

  return { openid }
}
