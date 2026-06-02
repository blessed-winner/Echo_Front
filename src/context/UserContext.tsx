import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN' | null>(null);

  const updateUserProfile = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
  };

  const hydrateUser = async () => {
    try {
      const token = getStoredAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        return false;
      }

      const response = await api.get<{ id: string; name: string; email: string; role: 'USER' | 'ADMIN' }>('/auth/me');
      const userData = response?.data;
      
      if (userData?.name && userData?.email) {
        setUserName(userData.name);
        setUserEmail(userData.email);
        setUserRole(userData.role || 'USER');
        setAccessToken(token);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[UserContext] Failed to fetch user data:', error);
      clearStoredAccessToken();
      setAccessToken(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    const isOAuthCallback =
      window.location.pathname === '/auth/success' &&
      new URLSearchParams(window.location.search).has('token');

    if (isOAuthCallback) {
      setIsAuthLoading(false);
      return;
    }

    const bootstrapAuth = async () => {
      const storedToken = getStoredAccessToken();

      if (storedToken) {
        await hydrateUser();
      } else {
        await refreshSession();
      }
    };

    void bootstrapAuth();
  }, []);

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
    const response = await api.get<string>('/auth/verify', {
      params: { token },
    });
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

  const refreshSession = async () => {
    try {
      const response = await api.post<{ accessToken: string }>('/auth/refresh');
      setStoredAccessToken(response.data.accessToken);
      setAccessToken(response.data.accessToken);
      await hydrateUser();
      return true;
    } catch (error) {
      clearStoredAccessToken();
      setAccessToken(null);
      setIsAuthenticated(false);
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
    <UserContext.Provider value={{
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
    }}>
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
