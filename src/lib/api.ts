import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_KEY = 'accessToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

const authFreePaths = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset',
  '/oauth2/authorization',
  '/auth/success',
];

let refreshPromise: Promise<string | null> | null = null;
let refreshTimeoutId: number | null = null;

const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const setStoredAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  scheduleTokenRefresh();
};

const clearStoredAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  if (refreshTimeoutId !== null) {
    window.clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
};

const scheduleTokenRefresh = () => {
  if (refreshTimeoutId !== null) {
    window.clearTimeout(refreshTimeoutId);
  }

  refreshTimeoutId = window.setTimeout(async () => {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      scheduleTokenRefresh();
    }
  }, 14 * 60 * 1000); // refresh every 14 minutes by default
};

const isAuthFreePath = (url?: string) => {
  if (!url) {
    return false;
  }

  return authFreePaths.some((path) => url.includes(path));
};

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then((response) => {
        const newToken = response.data.accessToken;
        setStoredAccessToken(newToken);
        return newToken;
      })
      .catch((error) => {
        console.error('Token refresh failed:', error);
        clearStoredAccessToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers = config.headers ?? ({} as InternalAxiosRequestConfig['headers']);
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_=${Date.now()}`;

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim()) {
      const trimmed = response.data.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          response.data = JSON.parse(trimmed);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
        }
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (
      status === 401 &&
      originalRequest &&
      !isAuthFreePath(originalRequest.url) &&
      !(originalRequest as { _retry?: boolean })._retry
    ) {
      console.log('[API] Attempting token refresh due to 401...');
      (originalRequest as { _retry?: boolean })._retry = true;
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        console.log('[API] Token refreshed successfully, retrying request...');
        originalRequest.headers = originalRequest.headers ?? ({} as InternalAxiosRequestConfig['headers']);
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${refreshedToken}`;
        return api.request(originalRequest);
      } else {
        console.error('[API] Token refresh failed');
      }
    }

    return Promise.reject(error);
  }
);

if (getStoredAccessToken()) {
  scheduleTokenRefresh();
}

export const oauthUrl = (provider: 'google' | 'github') => {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
};

export { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken };