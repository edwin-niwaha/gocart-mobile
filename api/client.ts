import axios from 'axios';
import { getTokens, saveTokens } from '@/utils/storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/* Attach access token + correct content type */
api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();

  config.headers = config.headers ?? {};

  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }

  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData;

  if (isFormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

/* Handle expired tokens */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      const tokens = await getTokens();

      if (!tokens?.refresh) {
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: tokens.refresh },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const newAccess = response.data.access;

        await saveTokens({
          access: newAccess,
          refresh: tokens.refresh,
        });

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);