import axios, { AxiosError} from 'axios';
import type{InternalAxiosRequestConfig} from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_KEY = 'accessToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

console.log('[API Config] Initialized with:', {
  baseURL: API_BASE_URL,
  hasStoredToken: !!localStorage.getItem(ACCESS_TOKEN_KEY)
});

// Token expires in 30 minutes, refresh 2 minutes before expiry
const TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

let accessTokenCache = localStorage.getItem(ACCESS_TOKEN_KEY);
let refreshPromise: Promise<string | null> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const authFreePaths = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/success',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset',
];

export const getApiBaseUrl = () => API_BASE_URL;

export const getStoredAccessToken = () => accessTokenCache ?? localStorage.getItem(ACCESS_TOKEN_KEY);

export const setStoredAccessToken = (token: string | null) => {
  accessTokenCache = token;

  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    const expiryTime = Date.now() + TOKEN_LIFETIME_MS;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    scheduleTokenRefresh();
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    clearRefreshTimer();
  }
};

export const clearStoredAccessToken = () => {
  setStoredAccessToken(null);
};

const clearRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

const scheduleTokenRefresh = () => {
  clearRefreshTimer();

  const expiryTimeStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTimeStr) {
    return;
  }

  const expiryTime = parseInt(expiryTimeStr, 10);
  const now = Date.now();
  const timeUntilRefresh = expiryTime - now - REFRESH_BEFORE_EXPIRY_MS;

  if (timeUntilRefresh <= 0) {
    // Token is about to expire or already expired, refresh immediately
    void refreshAccessToken();
  } else {
    // Schedule refresh before token expires
    refreshTimer = setTimeout(() => {
      void refreshAccessToken();
    }, timeUntilRefresh);
  }
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
        // Redirect to login if refresh fails
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

  // Add cache-busting parameter to all requests
  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_=${Date.now()}`;

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Handle backend returning JSON as strings
    if (typeof response.data === 'string' && response.data.trim()) {
      const trimmed = response.data.trim();
      
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
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

// Initialize token refresh schedule on module load
if (getStoredAccessToken()) {
  scheduleTokenRefresh();
}

export const oauthUrl = (provider: 'google' | 'github') => {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
};
