// utils/authStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type User = { id?: string; name: string; email: string };
const TOKEN_KEY = "authToken";
const USER_KEY = "currentUser";
const REMEMBER_KEY = "rememberEmail";
const AUTOLOGIN_KEY = "autoLogin";

// ===== JWT 토큰 관리 =====
export const saveToken = (t: string) => AsyncStorage.setItem(TOKEN_KEY, t);
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const removeToken = () => AsyncStorage.removeItem(TOKEN_KEY);

// ===== 현재 로그인 사용자 =====
export const setCurrentUser = (u: User | null) =>
  u ? AsyncStorage.setItem(USER_KEY, JSON.stringify(u)) : AsyncStorage.removeItem(USER_KEY);
export const getCurrentUser = async (): Promise<User | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

// ===== 부가 옵션 =====
export const setRememberEmail = (email: string) => AsyncStorage.setItem(REMEMBER_KEY, email);
export const getRememberEmail = () => AsyncStorage.getItem(REMEMBER_KEY);
export const setAutoLogin = (v: boolean) => AsyncStorage.setItem(AUTOLOGIN_KEY, v ? "true" : "false");
export const getAutoLogin = async () => (await AsyncStorage.getItem(AUTOLOGIN_KEY)) === "true";
