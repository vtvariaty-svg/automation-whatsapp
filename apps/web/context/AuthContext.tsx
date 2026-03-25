'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authStorage } from '@/lib/auth/auth';
import { authApi } from '@/lib/api/client';

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  tenantId: string;
  role: string;
  forcePasswordReset?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    /**
     * Bootstrap session from the server.
     *
     * Calls /api/auth/me which uses requireAuth() — validates JWT signature,
     * revocation, sessionVersion, and isActive. Returns real user data from DB.
     *
     * The Bearer token from localStorage is sent by apiClient automatically.
     * The httpOnly cookie is sent via credentials: 'include'.
     * Either one is sufficient for the server to authenticate the request.
     */
    const bootstrap = async () => {
      const savedToken = authStorage.getToken();

      // If neither localStorage token nor a potential cookie exists, skip the call.
      // We can't check the httpOnly cookie from JS, so attempt the call regardless
      // when a savedToken exists; also attempt without it in case cookie is valid.
      try {
        const meRes = await fetch('/api/auth/me', {
          headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
          credentials: 'include',
        });

        if (meRes.ok) {
          const userData: AuthUser = await meRes.json();
          setUser(userData);
          setToken(savedToken);
        } else {
          // Session is invalid — clean up
          authStorage.logout();
          setToken(null);
          setUser(null);
        }
      } catch {
        // Network error — clear state to be safe
        authStorage.logout();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const redirectAfterAuth = async (token: string) => {
    try {
      const res = await fetch('/api/onboarding/status', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
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
      // Server sets the httpOnly auth_token cookie automatically.
      // Store token in localStorage for Bearer auth in apiClient (dual-track).
      authStorage.saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
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
      if (response.requiresVerification) {
        setLoading(false);
        router.push('/verify-email-pending');
        return;
      }
      // Server sets the httpOnly auth_token cookie automatically.
      authStorage.saveToken(response.token);
      setToken(response.token);
      setUser(response.user);
      await redirectAfterAuth(response.token);
    } catch (error) {
      console.error('Register failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = authStorage.getToken();

    // Clear client state immediately for instant UX
    authStorage.logout();
    setToken(null);
    setUser(null);

    // Revoke token and clear httpOnly cookie server-side.
    // Must be awaited so the cookie is cleared before the redirect.
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
        credentials: 'include',
      });
    } catch {
      // Best-effort — user is already logged out client-side
    }

    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, token, loading, isSuperAdmin, login, register, logout }}>
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
