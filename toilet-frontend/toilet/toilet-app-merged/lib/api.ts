import axios, { InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../config";
import { getToken, removeToken } from "../utils/authStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await removeToken();
      console.warn("[api] 401 Unauthorized: 토큰이 만료되었거나 유효하지 않습니다.");
    }
    return Promise.reject(error);
  }
);

export default api;

