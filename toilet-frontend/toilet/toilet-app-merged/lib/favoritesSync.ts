// lib/favoritesSync.ts
import * as Network from "expo-network"; // Expo-friendly
import { batchFavorites, ToiletLite } from "../services/api";

type QueueItem =
  | { type: "add"; toilet: ToiletLite }
  | { type: "remove"; toilet: ToiletLite };



/** Frontend key rule — must match backend (/src/routes/favorites.js) */
const toKey = (t: ToiletLite) =>
  (t?.id as any) ?? `${t?.name}|${Number(t?.lat).toFixed(6)},${Number(t?.lng).toFixed(6)}`;

/**
 * Simple toggle helper for UI components that don't want to manage the queue.
 * It calls /favorites/batch with either an add or remove for the target.
 */
export async function toggleFavorite(args: {
  target: ToiletLite;
  currentList: { key: string; toilet: ToiletLite }[];
  onLocalUpdate?: (nextList: { key: string; toilet: ToiletLite }[]) => void;
  afterSync?: () => void | Promise<void>;
}) {
  const { target, currentList, onLocalUpdate, afterSync } = args;
  const key = toKey(target);
  const has = (currentList || []).some((i) => i.key === key);

  const payload = {
    adds: has ? [] : [target],
    removes: has ? [target] : [],
  };

  const res = await batchFavorites(payload);
  if (res?.success && Array.isArray((res as any).items)) {
    onLocalUpdate?.((res as any).items);
  }
  await afterSync?.();
  return res;
}
let queue: QueueItem[] = [];
let timer: any = null;

const FLUSH_DELAY = 600; // ms: 짧은 디바운스

export function enqueueToggle(toilet: ToiletLite, isAdding: boolean) {
  // id 없을 수 있음 → lat/lng/name만으로도 백엔드가 key 생성
  const safe: ToiletLite = {
    id: toilet.id,
    name: toilet.name,
    lat: Number(toilet.lat),
    lng: Number(toilet.lng),
    address: toilet.address,
  };

  queue.push({ type: isAdding ? "add" : "remove", toilet: safe });
  console.log("[favoritesSync] queued:", queue.length);

  // 간단 디바운스
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => flushNow().catch(() => {}), FLUSH_DELAY);
}

export async function flushNow() {
  if (!queue.length) return;

  // 네트워크 체크(선택)
  try {
    const state = await Network.getNetworkStateAsync();
    if (!(state?.isConnected ?? true)) {
      console.log("[favoritesSync] offline, skip flush");
      return;
    }
  } catch {
    // NetInfo 사용 안 하면 무시
  }

  // 큐 스냅샷 → 비우고 전송
  const snapshot = queue.slice();
  queue = [];

  const adds = snapshot.filter((q) => q.type === "add").map((q) => q.toilet);
  const removes = snapshot.filter((q) => q.type === "remove").map((q) => q.toilet);

  console.log("[favoritesSync] adds:", JSON.stringify(adds, null, 2));
  console.log("[favoritesSync] removes:", JSON.stringify(removes, null, 2));

  try {
    const res = await batchFavorites({ adds, removes });
    console.log("[favoritesSync] server ok items:", res.items?.length ?? 0);
    return res;
  } catch (e: any) {
    console.error("[favoritesSync] error:", e?.message || e);
    // 실패 시 스냅샷을 다시 큐에 되돌려 재시도 가능하게 함
    queue = snapshot.concat(queue);
    throw e;
  }
}

export function clearQueue() {
  queue = [];
  if (timer) clearTimeout(timer);
  timer = null;
}
