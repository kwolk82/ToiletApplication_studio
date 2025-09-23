import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = { name: string; email: string; password?: string };
export type Users = Record<string, User>;

const USERS_KEY = 'users';
const CURRENT_KEY = 'currentUser';
const REMEMBER_KEY = 'rememberEmail';
const AUTOLOGIN_KEY = 'autoLogin';

// ===== 기존 로컬 기능 유지 =====
export async function loadUsers(): Promise<Users> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}
export async function saveUsers(obj: Users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(obj));
}
export async function setCurrentUser(u: User | null) {
  if (!u) return AsyncStorage.removeItem(CURRENT_KEY);
  return AsyncStorage.setItem(CURRENT_KEY, JSON.stringify(u));
}
export async function getCurrentUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(CURRENT_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function setRememberEmail(v: string | null) {
  if (v == null) return AsyncStorage.removeItem(REMEMBER_KEY);
  return AsyncStorage.setItem(REMEMBER_KEY, v);
}
export const getRememberEmail = () => AsyncStorage.getItem(REMEMBER_KEY);
export async function setAutoLogin(v: boolean) {
  return AsyncStorage.setItem(AUTOLOGIN_KEY, v ? 'true' : 'false');
}
export async function getAutoLogin(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(AUTOLOGIN_KEY);
  return raw === 'true';
}

// ===== 새로 추가: JWT 토큰 관리 =====
const TOKEN_KEY = 'authToken';
export const saveToken = (t: string) => AsyncStorage.setItem(TOKEN_KEY, t);
export const getToken  = () => AsyncStorage.getItem(TOKEN_KEY);
export const removeToken = () => AsyncStorage.removeItem(TOKEN_KEY);
