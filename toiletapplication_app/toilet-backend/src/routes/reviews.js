// src/routes/reviews.js
import express from "express";
import Review from "../models/reviews.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// 프론트와 동일 규칙
const toKey = (t) =>
  (t && t.id) ?? `${t?.name ?? ""}|${Number(t?.lat).toFixed(6)},${Number(t?.lng).toFixed(6)}`;

function normalizeToilet(x = {}) {
  const name = typeof x.name === "string" ? x.name.trim() : "";
  const lat = Number(x.lat);
  const lng = Number(x.lng);
  const address = typeof x.address === "string" ? x.address.trim() : undefined;
  if (!name) throw new Error("name required");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("lat/lng invalid");
  return { id: x.id ?? null, name, lat, lng, address };
}

/** POST /reviews
 * body: { toilet: ToiletLite, rating?: 1..5, comment?: string }
 * 정책:
 *  - rating이 있으면: (userId,key)로 upsert → 한 유저가 한 장소에 별점 1개
 *  - comment가 있으면: 항상 새 문서로 insert (history 남김)
 */
router.post("/reviews", authRequired, async (req, res) => {
  try {
    const t = normalizeToilet(req.body?.toilet || {});
    const key = toKey(t);
    const userId = req.user.id;
    const userName = req.user.name || req.user.email || "사용자";

    const { rating, comment } = req.body || {};

    // 별점 upsert
    if (Number.isFinite(Number(rating))) {
      await Review.updateOne(
        { userId, key, rating: { $exists: true } },
        {
          userId,
          userName,
          key,
          toilet: t,
          rating: Math.max(1, Math.min(5, Number(rating))),
          comment: typeof comment === "string" ? comment : "", // 별점 문서에도 코멘트 저장 가능
        },
        { upsert: true }
      );
    }

    // 댓글-only 추가 (rating 없이, 코멘트만 별도 문서로 남기고 싶을 때)
    if (comment && !Number.isFinite(Number(rating))) {
      await Review.create({
        userId,
        userName,
        key,
        toilet: t,
        comment: String(comment),
      });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("[reviews:post] error:", e);
    return res
      .status(400)
      .json({ success: false, message: "Failed to submit review", error: e.message });
  }
});

// GET /reviews/:key → 댓글 목록(최근순)
router.get("/reviews/:key", async (req, res) => {
  try {
    const key = String(req.params.key);
    const docs = await Review.find({ key, comment: { $exists: true, $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({
      success: true,
      items: docs.map((d) => ({
        id: String(d._id),
        userName: d.userName,
        comment: d.comment,
        createdAt: d.createdAt,
      })),
    });
  } catch (e) {
    console.error("[reviews:get] error:", e);
    return res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
});

// GET /ratings/:key → 평균 별점/개수 (없으면 avg=0.0, count=0)
router.get("/ratings/:key", async (req, res) => {
  try {
    const key = String(req.params.key);
    const agg = await Review.aggregate([
      { $match: { key, rating: { $exists: true } } },
      { $group: { _id: "$key", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (!agg.length) return res.json({ success: true, avg: 0.0, count: 0 });
    const { avg, count } = agg[0];
    return res.json({ success: true, avg: Number(avg.toFixed(1)), count });
  } catch (e) {
    console.error("[ratings:get] error:", e);
    return res.status(500).json({ success: false, message: "Failed to load rating" });
  }
});

export default router;
