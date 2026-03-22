"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

    // Save token to localStorage (must match authStorage key = "auth_token")
    localStorage.setItem("auth_token", token);

    // Set cookie too for API routes
    document.cookie = `auth_token=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;

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
