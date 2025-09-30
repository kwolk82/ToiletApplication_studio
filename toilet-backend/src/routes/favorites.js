// src/routes/favorites.js
import express from "express";
import Favorite from "../models/Favorite.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// 프론트와 동일 규칙: id가 있으면 id, 없으면 name|lat,lng
const toKey = (t) =>
  (t && t.id) ??
  `${t?.name ?? ""}|${Number(t?.lat).toFixed(6)},${Number(t?.lng).toFixed(6)}`;

// 입력값 정리 + 검증
function normalizeToilet(x = {}) {
  const name = typeof x.name === "string" ? x.name.trim() : "";
  const lat = Number(x.lat);
  const lng = Number(x.lng);
  const address = typeof x.address === "string" ? x.address.trim() : undefined;

  if (!name) throw new Error("Invalid payload: name required");
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw new Error("Invalid payload: lat/lng must be finite numbers");

  return { id: x.id ?? null, name, lat, lng, address };
}

// GET /favorites
router.get("/", authRequired, async (req, res) => {
  try {
    const docs = await Favorite.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: docs.map((d) => ({
        key: d.key,
        toilet: d.toilet,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[favorites:get] error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load favorites", error: e.message });
  }
});

/**
 * POST /favorites/batch
 * body: { adds: ToiletLite[], removes: ToiletLite[] }
 * ToiletLite = { id?: string, name: string, lat: number, lng: number, address?: string }
 */
router.post("/batch", authRequired, async (req, res) => {
  try {
    const adds = Array.isArray(req.body?.adds) ? req.body.adds : [];
    const removes = Array.isArray(req.body?.removes) ? req.body.removes : [];

    // 1) 유효성/정규화
    const safeAdds = adds.map(normalizeToilet);
    const safeRemoves = removes.map(normalizeToilet);

    // 2) upsert & delete
    for (const t of safeAdds) {
      const key = toKey(t);
      try {
        await Favorite.updateOne(
          { userId: req.user.id, key }, // ✅ key 기반
          {
            userId: req.user.id,
            key,
            toilet: {
              id: t.id ?? null,
              name: t.name,
              lat: t.lat,
              lng: t.lng,
              address: t.address,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        // ✅ 인덱스 전환 중/중복 상황에서도 500으로 안 떨어지게
        if (err && err.code === 11000) {
          // 이미 존재 → 무시
          console.warn("[favorites:batch] duplicate ignored:", key);
        } else {
          throw err;
        }
      }
    }

    for (const t of safeRemoves) {
      const key = toKey(t);
      await Favorite.deleteOne({ userId: req.user.id, key });
    }

    // 3) 최신 목록 반환
    const docs = await Favorite.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      items: docs.map((d) => ({
        key: d.key,
        toilet: d.toilet,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (e) {
    console.error("[favorites:batch] error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to batch update favorites", error: e.message });
  }
});

export default router;
