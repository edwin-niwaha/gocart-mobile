import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const DEFAULT_TENANT_SLUG =
  process.env.EXPO_PUBLIC_TENANT_SLUG?.trim() ?? '';

const REQUEST_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000
);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();

  if (!tokens?.refresh) {
    return null;
  }

  const response = await axios.post(
    `${API_BASE_URL}/auth/token/refresh/`,
    { refresh: tokens.refresh },
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        ...(DEFAULT_TENANT_SLUG
          ? { 'X-Tenant-Slug': DEFAULT_TENANT_SLUG }
          : {}),
      },
    }
  );

  const nextAccess = response.data?.access;
  if (typeof nextAccess !== 'string' || !nextAccess) {
    throw new Error('Token refresh did not return a valid access token.');
  }

  await saveTokens({
    access: nextAccess,
    refresh: tokens.refresh,
  });

  return nextAccess;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  config.headers = config.headers ?? {};

  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }

  if (DEFAULT_TENANT_SLUG) {
    config.headers['X-Tenant-Slug'] = DEFAULT_TENANT_SLUG;
  }

  config.headers['X-App-Version'] =
    process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev';

  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData;

  if (isFormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const nextAccess = await refreshPromise;

      if (!nextAccess) {
        await clearTokens();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);
