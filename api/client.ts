import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';

const rawBase = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.43.13:8000/api/v1').replace(/\/$/, '');
export const API_ROOT = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;

export const api = axios.create({
  baseURL: API_ROOT,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  if (tokens?.access) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

let refreshing = false;
let queue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

function flushQueue(error: unknown, token?: string) {
  queue.forEach((item) => {
    if (error) item.reject(error);
    else if (token) item.resolve(token);
  });
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry || original.url?.includes('/auth/login/') || original.url?.includes('/auth/token/refresh/')) {
      return Promise.reject(error);
    }

    const tokens = await getTokens();
    if (!tokens?.refresh) {
      await clearTokens();
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const response = await axios.post(`${API_ROOT}/auth/token/refresh/`, { refresh: tokens.refresh }, { headers: { 'Content-Type': 'application/json' } });
      const nextAccess = response.data.access as string;
      await saveTokens({ access: nextAccess, refresh: tokens.refresh });
      flushQueue(null, nextAccess);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${nextAccess}`;
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError);
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  }
);
