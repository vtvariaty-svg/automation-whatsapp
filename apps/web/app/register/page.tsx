'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      await register({ name, email, password });
    } catch (err) {
      setError("Erro ao criar conta. Verifique os dados e tente novamente.");
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
            Comece agora
          </h2>
          <p className="mt-2 text-sm text-gray-600 mb-8">
            Crie sua conta. Você ganha 7 dias grátis de Trial ao escolher um plano.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm" role="alert">
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                Nome da sua empresa
              </label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Minha Empresa Ltda"
                required
                className="w-full text-base py-2.5"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="reg-email">
                Email comercial
              </label>
              <Input
                type="email"
                id="reg-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                required
                className="w-full text-base py-2.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="reg-password">
                  Senha
                </label>
                <Input
                  type="password"
                  id="reg-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6"
                  required
                  className="w-full text-base py-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="confirm-password">
                  Confirme a senha
                </label>
                <Input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Mínimo 6"
                  required
                  className="w-full text-base py-2.5"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3 text-base shadow-md mt-2" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta e Iniciar"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Já possui uma conta?{" "}
            <Link href="/login" className="font-semibold text-[#4f46e5] hover:text-[#4338ca] hover:underline transition-all">
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      {/* Right side: Image/Branding / Dark theme showcase */}
      <div className="hidden lg:flex lg:flex-1 relative w-full items-center justify-center bg-[#0f172a] overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4f46e5] rounded-full mix-blend-screen filter blur-[120px] opacity-30"></div>

        <div className="relative z-10 w-full max-w-lg px-8">
          <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            {/* Fake Dashboard Mockup */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="text-xs text-slate-400 font-medium tracking-wider">PREVIEW DA PLATAFORMA</div>
            </div>
            
            <div className="space-y-4">
              <div className="h-4 w-1/3 bg-slate-700/50 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-slate-700/30 rounded border border-white/5"></div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20 flex flex-col justify-end p-4">
                   <div className="h-3 w-1/2 bg-indigo-400/50 rounded mb-2"></div>
                   <div className="h-6 w-3/4 bg-white/80 rounded"></div>
                </div>
                <div className="h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/20 flex flex-col justify-end p-4">
                   <div className="h-3 w-1/2 bg-emerald-400/50 rounded mb-2"></div>
                   <div className="h-6 w-1/3 bg-white/80 rounded"></div>
                </div>
              </div>
            </div>

            {/* Overlay badge */}
            <div className="absolute -right-12 top-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs py-1 px-10 transform rotate-45 shadow-lg">
              BETA
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Construa relaciomentos</h3>
            <p className="text-slate-400">Junte-se a empresas que já automatizaram mais de 10.000 atendimentos mensais.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
