'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

type PlanLabel = { nome: string; preco: string; cor: string; trialNote: string };

// Public vertical plans
const PLAN_LABELS: Record<string, PlanLabel> = {
  consultorio: {
    nome: "Plano Consultório",
    preco: "7 dias grátis, depois R$ 97,00/mês",
    cor: "bg-teal-600 text-white",
    trialNote: "Clínicas · Consultórios · Odontologia",
  },
  restaurante: {
    nome: "Plano Restaurante",
    preco: "7 dias grátis, depois R$ 97,00/mês",
    cor: "bg-orange-500 text-white",
    trialNote: "Restaurante · Delivery · Marmitaria",
  },
};

const LEGACY_PLANS = ['free', 'pro', 'business', 'standard', 'starter'];

function LegacyPlanNotice() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96 text-center">
      <div className="mb-8 flex justify-center">
        <img src="/logo.webp" alt="Variaty" className="h-36 w-auto opacity-80" />
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">
        Planos atualizados
      </h2>
      <p className="text-gray-500 mb-8 leading-relaxed font-medium text-sm">
        Os planos Free, Pro e Business foram descontinuados para novas assinaturas.
        Escolha o plano do seu negócio abaixo para começar com 7 dias de teste grátis.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href="/register?plan=consultorio"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-teal-600 text-white hover:bg-teal-500 transition-all"
        >
          Plano Consultório
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <Link
          href="/register?plan=restaurante"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-extrabold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all"
        >
          Plano Restaurante
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <Link
          href="/precos"
          className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors mt-1"
        >
          Ver comparação dos planos
        </Link>
      </div>
    </div>
  );
}

function NoPlanRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/precos'); }, [router]);
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96 flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
    </div>
  );
}

// Form component receives plan via props — all hooks declared unconditionally
function RegisterFormFields({ planSlug, planLabel }: { planSlug: string; planLabel: PlanLabel }) {
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
      const eventId = crypto.randomUUID();
      await register({ name, email, password, plan: planSlug, eventId });

      import("@/components/marketing/MetaPixel").then(({ leadEvent }) => {
        leadEvent(eventId, email);
      });
    } catch {
      setError("Erro ao criar conta. Verifique os dados e tente novamente.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div className="mb-8">
        <img src="/logo.webp" alt="Variaty" className="h-36 w-auto" />
      </div>

      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
        Comece agora
      </h2>

      <div className="mt-3 mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${planLabel.cor}`}>
            {planLabel.nome}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Plano selecionado</p>
            <p className="text-xs text-gray-500 mt-0.5">{planLabel.preco}</p>
          </div>
        </div>
        {planLabel.trialNote && (
          <p className="text-xs text-slate-400 font-medium mt-2">{planLabel.trialNote}</p>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Cartão necessário para ativar o teste · sem cobrança nos 7 dias
        </p>
      </div>

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
          {loading ? "Criando conta..." : "Criar conta e Continuar"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Já possui uma conta?{" "}
        <Link href="/login" className="font-semibold text-[#4f46e5] hover:text-[#4338ca] hover:underline transition-all">
          Fazer login
        </Link>
      </div>
    </div>
  );
}

// Routing wrapper — reads searchParams, decides which component to render
// Keeps all conditional logic outside of hook-bearing components
function RegisterContent() {
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan");

  if (!rawPlan) return <NoPlanRedirect />;

  if (LEGACY_PLANS.includes(rawPlan) || rawPlan === 'superadmin' || !PLAN_LABELS[rawPlan]) {
    return <LegacyPlanNotice />;
  }

  return <RegisterFormFields planSlug={rawPlan} planLabel={PLAN_LABELS[rawPlan]} />;
}

import MetaPixel from "@/components/marketing/MetaPixel";

export default function RegisterPage() {
  return (
    <>
      <MetaPixel />
      <div className="flex min-h-screen bg-gray-50">
        {/* Left side: Form */}
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
          <Suspense fallback={<div className="mx-auto w-full max-w-sm lg:w-96 animate-pulse"><div className="h-36 w-36 bg-gray-200 rounded mb-8" /></div>}>
            <RegisterContent />
          </Suspense>
        </div>

        {/* Right side: Branding */}
        <div className="hidden lg:flex lg:flex-1 relative w-full items-center justify-center bg-[#0f172a] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4f46e5] rounded-full mix-blend-screen filter blur-[120px] opacity-30" />

          <div className="relative z-10 w-full max-w-lg px-8">
            <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-slate-400 font-medium tracking-wider">PREVIEW DA PLATAFORMA</div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-700/30 rounded border border-white/5" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="h-24 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-xl border border-teal-500/20 flex flex-col justify-end p-4">
                    <div className="h-3 w-1/2 bg-teal-400/50 rounded mb-2" />
                    <div className="h-6 w-3/4 bg-white/80 rounded" />
                  </div>
                  <div className="h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/20 flex flex-col justify-end p-4">
                    <div className="h-3 w-1/2 bg-orange-400/50 rounded mb-2" />
                    <div className="h-6 w-1/3 bg-white/80 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Automatize seu atendimento</h3>
              <p className="text-slate-400">WhatsApp, IA assistiva e painel de controle para clínicas e restaurantes.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
