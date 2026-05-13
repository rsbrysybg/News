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
  const name = (event.name || "").trim()

  if (!id) {
    throw new Error("缺少id")
  }

  if (!name) {
    throw new Error("缺少name")
  }

  if (name === "推荐") {
    throw new Error("推荐栏目不可删除")
  }

  // 将该栏目下的新闻回退到“推荐”，避免首页筛选不到
  // 这里用分页逐个更新，避免批量 update 的条数限制影响
  while (true) {
    const res = await db.collection("news").where({ category: name }).limit(20).get()
    const list = res.data || []
    if (list.length === 0) break

    await Promise.all(
      list.map((it) =>
        db
          .collection("news")
          .doc(it._id)
          .update({
            data: {
              category: "推荐",
            },
          })
      )
    )
  }

  await db.collection("categories").doc(id).remove()

  return { ok: true }
}
