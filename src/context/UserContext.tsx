import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

type AuthSnapshot = {
  accessToken: string | null;
  isAuthenticated: boolean;
  userName: string;
  userEmail: string;
  profileImage: string | null;
  userRole: 'USER' | 'ADMIN' | null;
};

const AUTH_SNAPSHOT_KEY = 'echoAuthSnapshot';

const readAuthSnapshot = (): AuthSnapshot | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as AuthSnapshot) : null;
  } catch {
    return null;
  }
};

const writeAuthSnapshot = (snapshot: AuthSnapshot) => {
  try {
    sessionStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
};

const clearAuthSnapshot = () => {
  try {
    sessionStorage.removeItem(AUTH_SNAPSHOT_KEY);
  } catch {
    // Ignore storage failures during teardown.
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedSnapshot = readAuthSnapshot();
  const initialToken = storedSnapshot?.accessToken ?? getStoredAccessToken();

  const [userName, setUserName] = useState(storedSnapshot?.userName ?? '');
  const [userEmail, setUserEmail] = useState(storedSnapshot?.userEmail ?? '');
  const [profileImage, setProfileImageState] = useState<string | null>(storedSnapshot?.profileImage ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(storedSnapshot?.isAuthenticated ?? !!initialToken);
  const [isAuthLoading, setIsAuthLoading] = useState(!!initialToken);
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN' | null>(storedSnapshot?.userRole ?? null);
  const hydrateRunIdRef = useRef(0);
  const profileImageRef = useRef<string | null>(storedSnapshot?.profileImage ?? null);
  const userNameRef = useRef(storedSnapshot?.userName ?? '');
  const userEmailRef = useRef(storedSnapshot?.userEmail ?? '');
  const userRoleRef = useRef<'USER' | 'ADMIN' | null>(storedSnapshot?.userRole ?? null);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    userEmailRef.current = userEmail;
  }, [userEmail]);

  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  const persistSnapshot = useCallback(
    (overrides: Partial<AuthSnapshot> = {}) => {
      const snapshot: AuthSnapshot = {
        accessToken,
        isAuthenticated,
        userName,
        userEmail,
        profileImage,
        userRole,
        ...overrides,
      };

      if (!snapshot.accessToken || !snapshot.isAuthenticated) {
        clearAuthSnapshot();
        return;
      }

      writeAuthSnapshot(snapshot);
    },
    [accessToken, isAuthenticated, profileImage, userEmail, userName, userRole]
  );

  const updateUserProfile = useCallback(
    (name: string, email: string) => {
      setUserName(name);
      setUserEmail(email);
      persistSnapshot({ userName: name, userEmail: email });
    },
    [persistSnapshot]
  );

  const setProfileImage = useCallback(
    (image: string | null) => {
      setProfileImageState(image);
      profileImageRef.current = image;
      persistSnapshot({ profileImage: image });
    },
    [persistSnapshot]
  );

  const hydrateUser = useCallback(async (): Promise<boolean> => {
    const runId = ++hydrateRunIdRef.current;

    try {
      const token = getStoredAccessToken();
      if (!token) {
        if (runId === hydrateRunIdRef.current) {
          setIsAuthenticated(false);
          setIsAuthLoading(false);
          clearAuthSnapshot();
        }
        return false;
      }

      if (runId === hydrateRunIdRef.current) {
        setIsAuthLoading(true);
      }

      const response = await api.get<{
        id: string;
        name: string;
        email: string;
        role: 'USER' | 'ADMIN';
      }>('/auth/me');

      if (runId !== hydrateRunIdRef.current) {
        return false;
      }

      const userData = response?.data;
      if (userData?.name && userData?.email) {
        setUserName(userData.name);
        setUserEmail(userData.email);
        setUserRole(userData.role || 'USER');
        setAccessToken(token);
        setIsAuthenticated(true);
        setIsAuthLoading(false);
        writeAuthSnapshot({
          accessToken: token,
          isAuthenticated: true,
          userName: userData.name,
          userEmail: userData.email,
          profileImage: profileImageRef.current,
          userRole: userData.role || 'USER',
        });
        return true;
      }

      setIsAuthLoading(false);
      writeAuthSnapshot({
        accessToken: token,
        isAuthenticated: true,
        userName: userNameRef.current,
        userEmail: userEmailRef.current,
        profileImage: profileImageRef.current,
        userRole: userRoleRef.current,
      });
      return false;
    } catch (error: any) {
      if (runId !== hydrateRunIdRef.current) {
        return false;
      }

      console.error('[UserContext] Failed to fetch user data:', error);

      if (error?.response?.status === 401) {
        clearStoredAccessToken();
        setAccessToken(null);
        setIsAuthenticated(false);
        setUserName('');
        setUserEmail('');
        setProfileImageState(null);
        setUserRole(null);
        profileImageRef.current = null;
        userNameRef.current = '';
        userEmailRef.current = '';
        userRoleRef.current = null;
        clearAuthSnapshot();
      }

      setIsAuthLoading(false);
      return false;
    }
  }, []);

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
      setProfileImageState(null);
      setUserName('');
      setUserEmail('');
      setUserRole(null);
      profileImageRef.current = null;
      userNameRef.current = '';
      userEmailRef.current = '';
      userRoleRef.current = null;
      clearAuthSnapshot();
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
        setProfileImageState(null);
        setUserName('');
        setUserEmail('');
        setUserRole(null);
        profileImageRef.current = null;
        userNameRef.current = '';
        userEmailRef.current = '';
        userRoleRef.current = null;
        clearAuthSnapshot();
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
