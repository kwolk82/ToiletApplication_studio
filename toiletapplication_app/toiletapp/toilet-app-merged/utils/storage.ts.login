/**
 * 로컬 스토리지 유틸(AsyncStorage)
 * - 데모: 평문 저장(실서비스는 SecureStore 권장)
 * - 키:
 *   - auth/users: 모든 사용자(로컬 데모 DB)
 *   - auth/user: 현재 로그인 사용자(로컬 데모)
 *   - auth/rememberEmail: 아이디 저장
 *   - auth/autoLogin: 자동 로그인
 *   - auth/at, auth/rt: 서버 모드용 액세스/리프레시 토큰
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'auth/user';
const USERS_DB_KEY = 'auth/users';
const REMEMBER_EMAIL_KEY = 'auth/rememberEmail';
const AUTO_LOGIN_KEY = 'auth/autoLogin';
const ACCESS_TOKEN_KEY = 'auth/at';
const REFRESH_TOKEN_KEY = 'auth/rt';

export type User = { name: string; email: string; password: string };

// 현재 로그인 사용자(로컬 데모용)
export async function saveCurrentUser(user: Omit<User,'password'>) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}
export async function getCurrentUser(): Promise<null | Omit<User,'password'>> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function clearCurrentUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

// 로컬 유저 DB(이메일을 key로 사용)
export async function loadUsers(): Promise<Record<string, User>> {
  const raw = await AsyncStorage.getItem(USERS_DB_KEY);
  return raw ? JSON.parse(raw) : {};
}
export async function saveUsers(users: Record<string, User>) {
  await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

// 아이디 저장/자동 로그인 설정
export async function getRememberedEmail(): Promise<{enabled: boolean; email?: string} | null> {
  const raw = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}
export async function setRememberedEmail(email: string) {
  if (email) await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, JSON.stringify({ enabled: true, email }));
  else await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, JSON.stringify({ enabled: false }));
}

export async function getAutoLoginPref(): Promise<{enabled: boolean} | null> {
  const raw = await AsyncStorage.getItem(AUTO_LOGIN_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function setAutoLoginPref(enabled: boolean) {
  await AsyncStorage.setItem(AUTO_LOGIN_KEY, JSON.stringify({ enabled }));
}

// 서버 모드: 토큰 저장(실서비스는 expo-secure-store 권장)
export async function saveAuthTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}
export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}
export async function clearAuthTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

/** 닉네임 정규화 & 중복 체크(로컬 데모) */
export function normalizeNickname(s: string) {
  return s.trim().toLowerCase();
}
export async function isNicknameTaken(name: string): Promise<boolean> {
  const users = await loadUsers();
  const target = normalizeNickname(name);
  const list = Object.values(users) as User[];
  return list.some(u => normalizeNickname(u.name) === target);
}

/** 테스트 초기화 */
export async function resetAuthDemo() {
  await AsyncStorage.multiRemove([
    USER_KEY,
    USERS_DB_KEY,
    REMEMBER_EMAIL_KEY,
    AUTO_LOGIN_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
}
