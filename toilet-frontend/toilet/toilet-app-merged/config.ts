// config.ts
import Constants from "expo-constants";

// Prefer EXPO_PUBLIC_* env (EAS / Expo Go), then expoConfig.extra, then a safe default
const extra: any =
  (Constants.expoConfig?.extra as any) ||
  // legacy manifest path for older Expo clients
  (Constants as any)?.manifest?.extra ||
  {};

export const API_BASE_URL: string =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string) ||
  (extra.API_BASE_URL as string) ||
  "https://toilet-backend-starter.onrender.com";

export const KAKAO_JAVASCRIPT_KEY: string =
  (process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY as string) ||
  (extra.KAKAO_JAVASCRIPT_KEY as string) ||
  "";

if (!API_BASE_URL) {
  console.warn(
    "[config] API_BASE_URL 미설정: app.config.ts의 extra.API_BASE_URL 또는 EXPO_PUBLIC_API_BASE_URL 환경변수를 확인하세요."
  );
}
