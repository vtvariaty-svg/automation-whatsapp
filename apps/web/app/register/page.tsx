'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
          <div className="mb-8">
            <Image src="/logo.png" alt="Variaty Secretary" width={240} height={110} className="h-24 w-auto object-contain" priority />
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

          {/* Social Login Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">ou registre-se com</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { window.location.href = "/api/auth/facebook"; }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border border-gray-200 bg-[#1877F2] text-white font-medium hover:bg-[#166FE5] transition-all shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Registrar com Facebook
            </button>

            <button
              onClick={() => { window.location.href = "/api/auth/instagram"; }}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border border-gray-200 text-white font-medium transition-all shadow-sm"
              style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Registrar com Instagram
            </button>
          </div>

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
