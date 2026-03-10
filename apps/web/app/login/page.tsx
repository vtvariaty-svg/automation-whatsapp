'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
    } catch (err) {
      setError("Email ou senha inválidos. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side: Form */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#4338ca] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">VTvariaty</span>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-gray-600 mb-8">
            Faça login para gerenciar sua IA Secretaria
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm" role="alert">
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full text-base py-2.5"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                  Senha
                </label>
                <a href="#" className="text-sm font-medium text-[#4f46e5] hover:text-[#4338ca]">
                  Esqueceu a senha?
                </a>
              </div>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-base py-2.5"
              />
            </div>

            <Button type="submit" className="w-full py-3 text-base shadow-md" disabled={loading}>
              {loading ? "Entrando..." : "Entrar na plataforma"}
            </Button>
          </form>

          {/* Social Login Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">ou continue com</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { window.location.href = "/api/auth/facebook"; }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border border-gray-200 bg-[#1877F2] text-white font-medium hover:bg-[#166FE5] transition-all shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Entrar com Facebook
            </button>

            <button
              onClick={() => { window.location.href = "/api/auth/instagram"; }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border border-gray-200 text-white font-medium transition-all shadow-sm"
              style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Entrar com Instagram
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/register" className="font-semibold text-[#4f46e5] hover:text-[#4338ca] hover:underline transition-all">
              Criar conta agora
            </Link>
          </div>
        </div>
      </div>

      {/* Right side: Image/Branding */}
      <div className="hidden lg:flex lg:flex-1 relative w-full items-center justify-center bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg className="absolute h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <polygon fill="currentColor" points="0,100 100,0 100,100" />
           </svg>
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#4338ca] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 p-12 lg:p-20 flex flex-col items-start max-w-2xl text-white">
          <Badge className="mb-6 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm">VTvariaty IA Secretaria</Badge>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            O futuro do atendimento no WhatsApp.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-10">
            Automatize vendas, agendamentos e suporte ao cliente com uma inteligência artificial que trabalha por você 24 horas por dia, 7 dias por semana.
          </p>
          
          <div className="grid grid-cols-2 gap-6 w-full mt-8 border-t border-white/10 pt-10">
            <div>
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-gray-400">Atendimento ininterrupto</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-gray-400">Integração nativa API Oficial</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {children}
    </span>
  );
}
