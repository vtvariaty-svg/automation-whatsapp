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
      try {
        const base64Url = savedToken.split('.')[1];
        if (!base64Url) throw new Error("Invalid JWT format (possibly old mock token)");
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        setToken(savedToken);
        setUser({ 
          id: payload.userId, 
          tenantId: payload.tenantId, 
          role: payload.role || 'user',
          email: 'user@empresa.com', 
          name: 'Usuário' 
        });
      } catch (e) {
        console.warn("Token inválido ou antigo. Forçando logout...");
        authStorage.logout();
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const redirectAfterAuth = async (token: string) => {
    try {
      const res = await fetch('/api/onboarding/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.setupCompleted) {
          router.push(`/onboarding/step/${data.setupStep || 1}`);
          return;
        }
      }
    } catch {}
    router.push('/dashboard');
  };

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      setUser(response.user);
      authStorage.saveToken(response.token);
      document.cookie = `auth_token=${response.token}; path=/; max-age=86400`;
      await redirectAfterAuth(response.token);
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
      await redirectAfterAuth(response.token);
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

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
