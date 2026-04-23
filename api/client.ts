import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getTokens, saveTokens } from '@/utils/storage';

const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV?.trim() ||
  process.env.NODE_ENV ||
  'development';

const ALLOW_INSECURE_API =
  process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === 'true';

const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export const API_BASE_URL = RAW_API_BASE_URL;

export const DEFAULT_TENANT_SLUG =
  process.env.EXPO_PUBLIC_TENANT_SLUG?.trim() ?? '';

const REQUEST_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 15000
);

function isReleaseEnv() {
  return APP_ENV === 'production' || APP_ENV === 'staging';
}

export function getApiConfigurationError() {
  if (!API_BASE_URL) {
    return 'Missing EXPO_PUBLIC_API_BASE_URL. Configure the app API URL before release.';
  }

  if (!Number.isFinite(REQUEST_TIMEOUT_MS) || REQUEST_TIMEOUT_MS <= 0) {
    return 'EXPO_PUBLIC_API_TIMEOUT_MS must be a positive number.';
  }

  try {
    const parsedUrl = new URL(API_BASE_URL);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'EXPO_PUBLIC_API_BASE_URL must use http or https.';
    }

    if (
      isReleaseEnv() &&
      parsedUrl.protocol !== 'https:' &&
      !ALLOW_INSECURE_API
    ) {
      return 'Release API URL must use HTTPS. Set EXPO_PUBLIC_ALLOW_INSECURE_API=true only for a temporary internal build.';
    }
  } catch {
    return 'EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.';
  }

  return null;
}

function assertApiConfigured() {
  const configurationError = getApiConfigurationError();
  if (configurationError) {
    throw new Error(configurationError);
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  assertApiConfigured();

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
  assertApiConfigured();

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
