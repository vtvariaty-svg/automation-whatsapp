'use client';

/**
 * CrowWidget
 *
 * Loads the Crow AI copilot widget and wires identity + context.
 * Gated by NEXT_PUBLIC_CROW_ENABLED=true.
 *
 * Identity: calls /api/crow-token → signed JWT (HS256) so Crow can
 * associate widget sessions with the authenticated tenant user.
 */

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const PRODUCT_ID = process.env.NEXT_PUBLIC_CROW_PRODUCT_ID ?? 'user_3ByBdX8BL31d1keEC6Pej4d2F7y';
const API_URL = 'https://api.usecrow.ai';

declare global {
  interface Window {
    crow?: (command: string, ...args: unknown[]) => void;
  }
}

export default function CrowWidget() {
  const pathname = usePathname();

  // Re-push context whenever the route changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.crow) return;
    window.crow('setContext', { currentRoute: pathname });
  }, [pathname]);

  function handleLoad() {
    if (typeof window === 'undefined' || !window.crow) return;

    // Wire identity: fetch a short-lived signed JWT from our backend
    window.crow('setIdentityTokenFetcher', async () => {
      try {
        const res = await fetch('/api/crow-token');
        if (!res.ok) return null;
        const data = await res.json();
        return data.token ?? null;
      } catch {
        return null;
      }
    });

    // Initial context
    window.crow('setContext', { currentRoute: pathname });
  }

  return (
    <Script
      src={`${API_URL}/static/crow-widget.js`}
      data-product-id={PRODUCT_ID}
      data-api-url={API_URL}
      strategy="lazyOnload"
      onLoad={handleLoad}
    />
  );
}
