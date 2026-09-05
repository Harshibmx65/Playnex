import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, OtpResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginGuest: () => Promise<void>;
  loginDemo: () => Promise<void>; // Backward-compatible alias for guest
  sendRegisterOtp: (name: string, email: string, password: string) => Promise<OtpResponse>;
  verifyRegisterOtp: (email: string, otpCode: string) => Promise<void>;
  resendRegisterOtp: (email: string) => Promise<OtpResponse>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const handleAuthSuccess = (res: AuthResponse) => {
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    handleAuthSuccess(res);
  };

  const loginGuest = async () => {
    const res = await authApi.guestLogin();
    handleAuthSuccess(res);
  };

  const sendRegisterOtp = async (name: string, email: string, password: string) => {
    return await authApi.sendRegisterOtp(name, email, password);
  };

  const verifyRegisterOtp = async (email: string, otpCode: string) => {
    const res = await authApi.verifyRegisterOtp(email, otpCode);
    handleAuthSuccess(res);
  };

  const resendRegisterOtp = async (email: string) => {
    return await authApi.resendRegisterOtp(email);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    handleAuthSuccess(res);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isGuest = Boolean(user?.is_guest);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isGuest,
        login,
        loginGuest,
        loginDemo: loginGuest,
        sendRegisterOtp,
        verifyRegisterOtp,
        resendRegisterOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

