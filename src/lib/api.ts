import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_KEY = 'accessToken';

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setStoredAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearStoredAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Single request interceptor: attach auth header AND log in one pass.
// Previously two separate interceptors were registered, and Axios executes
// them in reverse-registration order, meaning the logger ran before the
// auth header was set — so `hasToken` in the log was always stale and, more
// critically, the Authorization header could be missing on the first tick.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers = config.headers ?? ({} as InternalAxiosRequestConfig['headers']);
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  // Prevent browser caching by adding a unique parameter to every request
  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}_=${Date.now()}`;

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const oauthUrl = (provider: 'google' | 'github') =>
  `${API_BASE_URL}/oauth2/authorization/${provider}`;