// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

// ✅ axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Render 콜드스타트 고려
});

// ✅ 요청 인터셉터: 토큰 자동 부착
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    // AxiosHeaders 여부 상관없이 항상 객체 병합으로 처리
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
});

// ✅ 응답 인터셉터: 토큰 만료 처리 + 네트워크 재시도
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const cfg: any = error.config || {};
    const status = error?.response?.status;

    // 401 → 자동 로그아웃
    if (status === 401) {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("currentUser");
      return Promise.reject(error);
    }

    // 서버 오류나 네트워크 오류 → 1회 재시도
    const retriable =
      !cfg.__isRetry &&
      ((status && status >= 500) ||
        error.code === "ECONNABORTED" ||
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("timeout"));

    if (retriable) {
      cfg.__isRetry = true;
      await new Promise((r) => setTimeout(r, 800));
      return api.request(cfg);
    }

    return Promise.reject(error);
  }
);

// ---------- API 함수들 ----------

// 회원가입
export async function signup(name: string, email: string, password: string) {
  const { data } = await api.post("/auth/signup", { name, email, password });
  return data as {
    success: boolean;
    token: string;
    user: { id: string; name: string; email: string };
  };
}

// 로그인
export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data as {
    success: boolean;
    token: string;
    user: { id: string; name: string; email: string };
  };
}

// ToiletLite 타입
export type ToiletLite = {
  id?: string;
  name: string;
  lat: number | string;
  lng: number | string;
  address?: string;
};

// Favorite Item 타입
export type FavItem = {
  key: string;
  toilet: ToiletLite;
  createdAt: string;
  updatedAt: string;
};

// 프론트/백엔드 동일 규칙
export const toKey = (t: ToiletLite) =>
  t?.id ??
  `${t?.name}|${Number(t?.lat).toFixed(6)},${Number(t?.lng).toFixed(6)}`;

// 즐겨찾기 목록 불러오기
export async function fetchFavorites() {
  const { data } = await api.get("/favorites");
  return data as { success: boolean; items: FavItem[] };
}

// 즐겨찾기 일괄 반영
export async function batchFavorites(payload: { adds: ToiletLite[]; removes: ToiletLite[] }) {
  const normalize = (x: ToiletLite): ToiletLite => ({
    ...x,
    lat: Number(x.lat),
    lng: Number(x.lng),
  });

  const body = {
    adds: (payload.adds || []).map(normalize),
    removes: (payload.removes || []).map(normalize),
  };

  const { data } = await api.post("/favorites/batch", body);
  return data as { success: boolean; items: FavItem[] };
}
