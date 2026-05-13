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

  const id = (event.id || "").trim()
  const title = (event.title || "").trim()
  const author = (event.author || "").trim()
  const summary = (event.summary || "").trim()
  const content = event.content || ""
  const coverImg = event.coverImg || ""
  const category = (event.category || "推荐").trim() || "推荐"

  if (!title) {
    throw new Error("标题不能为空")
  }
  if (!content || (typeof content === "string" && !content.trim())) {
    throw new Error("正文不能为空")
  }

  if (id) {
    await db
      .collection("news")
      .doc(id)
      .update({
        data: {
          title,
          author,
          summary,
          content,
          coverImg,
          category,
        },
      })

    return { ok: true, id }
  }

  const addRes = await db.collection("news").add({
    data: {
      title,
      author,
      summary,
      content,
      coverImg,
      category,
      viewCount: 0,
      publishDate: Date.now(),
    },
  })

  return { ok: true, id: addRes._id }
}
