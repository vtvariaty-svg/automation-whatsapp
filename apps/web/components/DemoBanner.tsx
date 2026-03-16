'use client';

import { useEffect, useState } from 'react';

interface DemoModeResponse {
  isDemo: boolean;
  tenantName: string;
}

/**
 * DemoBanner — renders a fixed top banner when the current tenant is a demo tenant.
 * Fetches GET /api/demo/mode on mount using the stored JWT token.
 */
export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    fetch('/api/demo/mode', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DemoModeResponse | null) => {
        if (data) {
          setIsDemo(data.isDemo);
          setTenantName(data.tenantName);
        }
      })
      .catch(() => {
        // Silently fail — banner simply won't appear
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  if (!loaded || !isDemo) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-medium"
      style={{
        background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
        color: '#78350f',
      }}
    >
      <div className="flex items-center gap-2">
        <span>🎭 Modo Demo — {tenantName || 'Studio Bella'}</span>
        <span className="hidden sm:inline text-amber-800 font-normal">
          · Dados fictícios para demonstração
        </span>
      </div>

      <a
        href="/register"
        className="ml-4 shrink-0 rounded-md bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-800 transition-colors"
      >
        Criar conta real →
      </a>
    </div>
  );
}
