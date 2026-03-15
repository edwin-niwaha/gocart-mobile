import axios from 'axios';
import { getTokens, saveTokens } from '@/utils/storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* Attach access token */
api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();

  if (tokens?.access) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }

  return config;
});

/* Handle expired tokens */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const tokens = await getTokens();

      if (!tokens?.refresh) {
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: tokens.refresh }
        );

        const newAccess = response.data.access;

        await saveTokens({
          access: newAccess,
          refresh: tokens.refresh,
        });

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);