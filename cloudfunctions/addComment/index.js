const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

async function getOrCreateUser(openid) {
  const res = await db.collection("users").where({ openid }).limit(1).get()
  const existed = res.data?.[0]
  if (existed) return existed

  const newUser = {
    openid,
    nickName: "用户",
    avatarUrl: "",
    isAdmin: false,
    joinTime: Date.now(),
  }

  const addRes = await db.collection("users").add({ data: newUser })
  return { ...newUser, _id: addRes._id }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const newsId = event.newsId
  const content = (event.content || "").trim()

  if (!newsId) {
    throw new Error("缺少newsId")
  }
  if (!content) {
    throw new Error("评论内容不能为空")
  }

  const user = await getOrCreateUser(openid)

  await db.collection("comments").add({
    data: {
      newsId,
      userInfo: {
        nickName: user.nickName || "用户",
        avatarUrl: user.avatarUrl || "",
      },
      content,
      createTime: Date.now(),
      // 0=已上架(兼容历史)，1=已下架，2=待审核
      status: 2,
    },
  })

  return { ok: true }
}
