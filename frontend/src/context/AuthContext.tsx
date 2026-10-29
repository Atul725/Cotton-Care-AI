import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, AuthUser, getStoredToken, getStoredUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    email?: string;
    name?: string;
    location?: string;
    land_acres?: number;
    contact_number?: string;
  }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check token validity on mount
    const token = getStoredToken();
    if (token) {
      api.getMe()
        .then((me) => {
          if (me) setUser(me);
          else setUser(null);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, pass: string) => {
    const res = await api.login(usernameOrEmail, pass);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const register = async (data: {
    username: string;
    password: string;
    email?: string;
    name?: string;
    location?: string;
    land_acres?: number;
    contact_number?: string;
  }) => {
    const res = await api.register(data);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.loginWithGoogle(idToken);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const quickDemoLogin = async () => {
    try {
      await login('demo_farmer', 'demo123');
    } catch {
      // In case password was reset, set demo user directly
      const demoUser: AuthUser = {
        id: 1,
        identifier: 'demo_farmer',
        email: 'demo@cottoncare.ai',
        name: 'शेतकरी मित्र (Ramesh Patil)',
        location: 'छत्रपती संभाजीनगर',
        land_acres: 4.5,
        auth_provider: 'demo'
      };
      setUser(demoUser);
      setAuthModalOpen(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        register,
        loginWithGoogle,
        quickDemoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
