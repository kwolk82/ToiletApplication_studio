// src/routes/reviews.js
import express from "express";
import Review from "../models/reviews.js"; // ✅ 파일명/대소문자 정확히
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// 프론트와 동일한 key 규칙: id가 있으면 id, 없으면 "name|lat.toFixed(6),lng.toFixed(6)"
const toKey = (t) =>
  (t && t.id) ??
  `${t?.name ?? ""}|${Number(t?.lat).toFixed(6)},${Number(t?.lng).toFixed(6)}`;

function normalizeToilet(x = {}) {
  const name = typeof x.name === "string" ? x.name.trim() : "";
  const lat = Number(x.lat);
  const lng = Number(x.lng);
  const address = typeof x.address === "string" ? x.address.trim() : undefined;
  if (!name) throw new Error("name required");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("lat/lng invalid");
  return { id: x.id ?? null, name, lat, lng, address };
}

/**
 * POST /reviews
 * body: { toilet: ToiletLite, rating?: 1..5, comment?: string }
 * 정책:
 *  - rating이 있으면: (userId,key)로 upsert → 유저·장소당 별점 1개
 *  - rating 없이 comment만 있으면: 항상 새 문서 insert (댓글 히스토리)
 *  - 둘 다 있으면: 별점 문서 upsert 시 comment를 같이 저장(선택), 별도 댓글 문서는 만들지 않음
 */
router.post("/reviews", authRequired, async (req, res) => {
  try {
    const t = normalizeToilet(req.body?.toilet || {});
    const key = toKey(t);
    const userId = req.user.id;
    const userName = req.user.name || req.user.email || "사용자";

    const { rating, comment } = req.body || {};
    const hasRating = Number.isFinite(Number(rating));
    const hasComment = typeof comment === "string" && comment.trim().length > 0;

    if (!hasRating && !hasComment) {
      return res.status(400).json({
        success: false,
        message: "rating 또는 comment 중 최소 하나는 필요합니다.",
      });
    }

    // 1) 별점 upsert (스키마의 partial unique index와 호환)
    if (hasRating) {
      const r = Math.max(1, Math.min(5, Number(rating)));
      await Review.updateOne(
        { userId, key, rating: { $exists: true } },
        {
          userId,
          userName,
          key,
          toilet: t,
          rating: r,
          ...(hasComment ? { comment: String(comment) } : { comment: "" }),
        },
        { upsert: true }
      );
    }

    // 2) 댓글-only insert (rating이 없을 때만)
    if (!hasRating && hasComment) {
      await Review.create({
        userId,
        userName,
        key,
        toilet: t,
        comment: String(comment),
        // rating 미포함 → partial unique 인덱스 대상 아님 (여러 개 허용)
      });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("[reviews:post] error:", e);
    // 유니크 충돌 등은 400으로 반환
    return res.status(400).json({
      success: false,
      message: "Failed to submit review",
      error: e.message,
    });
  }
});

/**
 * GET /reviews/:key  → 댓글 목록(최근순)
 * - 별점 전용 문서(comment가 빈 문자열) 제외
 */
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

/**
 * GET /ratings/:key  → 평균 별점/개수 (없으면 avg=0.0, count=0)
 */
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

/**
 * PUT /reviews/:id  → 본인 글만 수정
 * - 별점 문서에 대해서만 rating 수정 허용
 * - comment는 빈 문자열 불가
 */
router.put("/reviews/:id", authRequired, async (req, res) => {
  try {
    const id = String(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = req.body || {};

    const doc = await Review.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    if (String(doc.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const update = {};

    // rating 수정: 이 문서가 '별점 문서'여야 함
    if (rating !== undefined) {
      if (!("rating" in doc)) {
        return res.status(400).json({
          success: false,
          message: "이 문서는 별점 문서가 아니어서 rating 수정 불가",
        });
      }
      const r = Number(rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: "rating must be 1..5" });
      }
      update.rating = Math.floor(r);
    }

    // comment 수정: 공백 불가
    if (comment !== undefined) {
      const c = String(comment).trim();
      if (c.length === 0) {
        return res.status(400).json({ success: false, message: "comment empty" });
      }
      update.comment = c;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const updated = await Review.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return res.json({ success: true, updated });
  } catch (e) {
    console.error("[reviews:put] error:", e);
    return res.status(500).json({ success: false, message: "Failed to update review" });
  }
});

/**
 * DELETE /reviews/:id  → 본인 글만 삭제
 */
router.delete("/reviews/:id", authRequired, async (req, res) => {
  try {
    const id = String(req.params.id);
    const userId = req.user.id;

    const doc = await Review.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    if (String(doc.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await Review.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (e) {
    console.error("[reviews:delete] error:", e);
    return res.status(500).json({ success: false, message: "Failed to delete review" });
  }
});

export default router;
