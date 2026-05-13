const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  const res = await db
    .collection("categories")
    .where({
      isActive: db.command.neq(false),
    })
    .orderBy("sort", "asc")
    .get()

  const list = (res.data || []).map((it) => ({
    _id: it._id,
    name: it.name,
    sort: it.sort || 0,
    isActive: it.isActive !== false,
  }))

  return { list }
}
