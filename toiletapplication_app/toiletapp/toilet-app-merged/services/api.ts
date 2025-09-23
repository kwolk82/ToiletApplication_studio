// services/api.ts
import Constants from "expo-constants";

const extra = (Constants.expoConfig as any)?.extra || (Constants.manifest as any)?.extra || {};
export const API_BASE: string = extra.apiBaseUrl || "https://toilet-backend-starter.onrender.com";

// iOS: localhost, Android: 10.0.2.2, 실기기: PC 내부IP

async function j<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any).message || r.statusText);
  return data as T;
}

export type LoginResp = {
  success: boolean;
  token?: string;
  user?: { id: string; name: string; email: string };
  message?: string;
};

export type FavoriteItem = {
  _id?: string;
  userId: string;
  toiletId: string;
  fav?: boolean;
  rating?: number;
  review?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const api = {
  signup(name: string, email: string, password: string) {
    return fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(j<LoginResp>);
  },
  login(email: string, password: string) {
    return fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(j<LoginResp>);
  },
  getFavorites(token: string) {
    return fetch(`${API_BASE}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(j<{ success: boolean; items: FavoriteItem[] }>);
  },
  upsertFavorite(token: string, payload: { toiletId: string; fav?: boolean; rating?: number; review?: string }) {
    return fetch(`${API_BASE}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).then(j<{ success: boolean; item: FavoriteItem }>);
  },
  deleteFavorite(token: string, toiletId: string) {
    return fetch(`${API_BASE}/favorites/${encodeURIComponent(toiletId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(j<{ success: boolean }>);
  },
};
