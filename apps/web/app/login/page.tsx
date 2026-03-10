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
