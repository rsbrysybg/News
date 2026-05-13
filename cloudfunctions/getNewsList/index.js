const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const category = (event.category || "").trim()
  const keyword = (event.keyword || "").trim()
  const skip = Number(event.skip || 0)
  const limit = Math.min(Number(event.limit || 10), 20)

  const where = {}

  if (category && category !== "推荐") {
    where.category = category
  }

  if (keyword) {
    where.title = db.RegExp({
      regexp: keyword,
      options: "i",
    })
  }

  const baseQuery = db.collection("news").where(where)

  // 有些数据是手工导入的，publishDate 可能缺失或类型不一致，会导致 orderBy 失败
  // 这里做降级：优先按 publishDate 排序，失败则按 _createTime 排序，保证能拉到数据
  let res
  try {
    res = await baseQuery.orderBy("publishDate", "desc").skip(skip).limit(limit).get()
  } catch (e) {
    res = await baseQuery.orderBy("_createTime", "desc").skip(skip).limit(limit).get()
  }

  return {
    list: res.data || [],
  }
}
