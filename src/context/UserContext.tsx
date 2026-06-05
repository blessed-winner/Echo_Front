import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearStoredAccessToken, getStoredAccessToken, oauthUrl, setStoredAccessToken } from '../lib/api';

interface UserContextType {
  userName: string;
  userEmail: string;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  updateUserProfile: (name: string, email: string) => void;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userRole: 'USER' | 'ADMIN' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  completeOAuth: (token: string) => Promise<void>;
  startOAuth: (provider: 'google' | 'github') => void;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<string>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = getStoredAccessToken();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);
  const [isAuthLoading, setIsAuthLoading] = useState(!!initialToken);
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN' | null>(null);

  const updateUserProfile = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
  };

  // Stable ref via useCallback so consumers (e.g. Dashboard) can safely list
  // it in their dependency arrays without triggering infinite re-renders.
  const hydrateUser = useCallback(async (): Promise<boolean> => {
    try {
      const token = getStoredAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return false;
      }

      const response = await api.get<{
        id: string;
        name: string;
        email: string;
        role: 'USER' | 'ADMIN';
      }>('/auth/me');

      const userData = response?.data;

      if (userData?.name && userData?.email) {
        setUserName(userData.name);
        setUserEmail(userData.email);
        setUserRole(userData.role || 'USER');
        setAccessToken(token);
        setIsAuthenticated(true);
        setIsAuthLoading(false);
        return true;
      }

      // Response parsed but missing expected fields — don't clear auth,
      // treat as a degraded server response.
      setIsAuthLoading(false);
      return false;
    } catch (error: any) {
      console.error('[UserContext] Failed to fetch user data:', error);

      if (error?.response?.status === 401) {
        // Explicit server rejection: token is invalid or expired.
        clearStoredAccessToken();
        setAccessToken(null);
        setIsAuthenticated(false);
      }
      // For all other failures (network blips, 5xx, timeouts) we intentionally
      // do NOT clear auth state. A transient error should not log the user out.
      // The dashboard will display an empty/loading state and the user can
      // retry by refreshing.

      setIsAuthLoading(false);
      return false;
    }
  }, []); // no dependencies: only touches localStorage + setState calls

  useEffect(() => {
    const isOAuthCallback =
      window.location.pathname === '/auth/success' &&
      new URLSearchParams(window.location.search).has('token');

    if (isOAuthCallback) {
      setIsAuthLoading(false);
      return;
    }

    const storedToken = getStoredAccessToken();
    if (storedToken) {
      void hydrateUser();
    } else {
      setIsAuthLoading(false);
      setIsAuthenticated(false);
    }
  }, [hydrateUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string }>('/auth/login', { email, password });
    setStoredAccessToken(response.data.accessToken);
    setAccessToken(response.data.accessToken);
    await hydrateUser();
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post<string>('/auth/register', { name, email, password });
    return response.data;
  };

  const requestPasswordReset = async (email: string) => {
    const response = await api.post<string>('/auth/forgot-password', { email });
    return response.data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const response = await api.post<string>('/auth/reset', { token, newPassword });
    return response.data;
  };

  const verifyEmail = async (token: string) => {
    const response = await api.get<string>('/auth/verify', { params: { token } });
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local session even if the server-side cookie delete fails.
    } finally {
      clearStoredAccessToken();
      setAccessToken(null);
      setIsAuthenticated(false);
      setProfileImage(null);
      setUserName('');
      setUserEmail('');
      setUserRole(null);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const response = await api.post<{ accessToken: string }>('/auth/refresh');
      setStoredAccessToken(response.data.accessToken);
      setAccessToken(response.data.accessToken);
      await hydrateUser();
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        clearStoredAccessToken();
        setAccessToken(null);
        setIsAuthenticated(false);
      }
      setIsAuthLoading(false);
      return false;
    }
  };

  const completeOAuth = async (token: string) => {
    setStoredAccessToken(token);
    setAccessToken(token);
    await hydrateUser();
  };

  const startOAuth = (provider: 'google' | 'github') => {
    window.location.assign(oauthUrl(provider));
  };

  return (
    <UserContext.Provider
      value={{
        userName,
        userEmail,
        profileImage,
        setProfileImage,
        updateUserProfile,
        accessToken,
        isAuthenticated,
        isAuthLoading,
        userRole,
        login,
        register,
        logout,
        refreshSession,
        completeOAuth,
        startOAuth,
        requestPasswordReset,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
