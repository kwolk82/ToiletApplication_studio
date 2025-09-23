// 간단한 API 래퍼(에러 문자열로 throw)
// 실제 서버 스펙에 맞춰 엔드포인트/응답 타입을 조정하세요.
import { API_BASE } from '../config';

type Json = Record<string, any>;

async function request<T = any>(
  method: 'GET'|'POST',
  path: string,
  body?: Json,
  token?: string
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // 비어있는 204 등의 응답
  return undefined as unknown as T;
}

// 예시 엔드포인트(서버가 제공해야 함)
/**
 * GET /auth/check-nickname?name=닉네임 -> { available: boolean }
 * POST /auth/send-email-code { email } -> 204 or { ok: true }
 * POST /auth/signup { name,email,password,code? } -> { user:{name,email}, accessToken, refreshToken }
 * POST /auth/login { email,password } -> { user:{name,email}, accessToken, refreshToken }
 * POST /auth/refresh { refreshToken } -> { user, accessToken, refreshToken }
 * POST /auth/logout { refreshToken } -> 204
 */

export const api = {
  checkNickname: (name: string) =>
    request<{ available: boolean }>('GET', `/auth/check-nickname?name=${encodeURIComponent(name)}`),

  sendEmailCode: (email: string) =>
    request('POST', '/auth/send-email-code', { email }),

  signup: (name: string, email: string, password: string, code?: string) =>
    request<{
      user: { name: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/signup', { name, email, password, code }),

  login: (email: string, password: string) =>
    request<{
      user: { name: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    request<{
      user: { name: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/refresh', { refreshToken }),

  logout: (refreshToken: string, accessToken?: string) =>
    request('POST', '/auth/logout', { refreshToken }, accessToken),
};
