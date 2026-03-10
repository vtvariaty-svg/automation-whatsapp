'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authStorage } from '@/lib/auth/auth';
import { authApi } from '@/lib/api/client';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = authStorage.getToken();
    if (savedToken) {
      setToken(savedToken);
      setUser({ email: 'user@demo.com', name: 'SaaS User' });
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      setUser(response.user);
      authStorage.saveToken(response.token);
      document.cookie = `auth_token=${response.token}; path=/; max-age=86400`;
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      setToken(response.token);
      setUser(response.user);
      authStorage.saveToken(response.token);
      document.cookie = `auth_token=${response.token}; path=/; max-age=86400`;
      router.push('/dashboard');
    } catch (error) {
      console.error('Register failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authStorage.logout();
    setToken(null);
    setUser(null);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
