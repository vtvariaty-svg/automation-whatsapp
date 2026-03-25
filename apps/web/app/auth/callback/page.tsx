"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * /auth/callback
 *
 * Landing page after social OAuth (Facebook / Instagram).
 *
 * By the time the browser reaches this page, the server-side callback routes
 * (/api/auth/facebook/callback and /api/auth/instagram/callback) have already
 * set the httpOnly auth_token cookie on the redirect response — the cookie
 * is present and valid before any JS runs here.
 *
 * This page's only remaining job:
 *   1. Persist the token to localStorage so apiClient can send Bearer headers.
 *   2. Redirect to /dashboard (AuthContext will handle onboarding redirect on mount).
 *
 * It must NOT write document.cookie — that would create a duplicate non-httpOnly
 * cookie that contradicts the canonical httpOnly cookie from the server.
 */
function CallbackContent() {
  const [status, setStatus] = useState("Finalizando login...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider") || "social";

    if (!token) {
      setStatus("❌ Token não recebido. Redirecionando...");
      setTimeout(() => { window.location.href = "/login?error=no_token"; }, 1500);
      return;
    }

    // Persist to localStorage for Bearer auth in apiClient (dual-track strategy).
    // The canonical httpOnly cookie is already set server-side — do NOT use
    // document.cookie here.
    localStorage.setItem("auth_token", token);

    setStatus(`✅ Login com ${provider === "instagram" ? "Instagram" : "Facebook"} realizado! Redirecionando...`);

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-[#4f46e5]/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Autenticação</h2>
        <p className="text-gray-600">{status}</p>
        {status.includes("Finalizando") && (
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-[#4f46e5] rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
