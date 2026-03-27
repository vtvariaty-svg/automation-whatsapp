"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ServiceItem {
  name: string;
  durationMinutes: number;
}

interface Step3Data {
  services: ServiceItem[];
  activeBotKey: string | null;
  botModules: string[];
  botBlueprint: string | null;
  botName: string | null;
  openingHours: string;
  address: string;
}

export default function OnboardingStep3() {
  const router = useRouter();
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([{ name: "", durationMinutes: 30 }]);
  const [openingHours, setOpeningHours] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/onboarding/step3", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Step3Data = await res.json();
          setStep3Data(data);
          if (data.services.length > 0) {
            setServices(data.services.map((s) => ({ name: s.name, durationMinutes: s.durationMinutes })));
          }
          if (data.openingHours) setOpeningHours(data.openingHours);
          if (data.address) setAddress(data.address);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const needsAgenda = step3Data?.botModules.includes("agenda") ?? false;
  const needsCatalog = step3Data?.botModules.includes("catalogo") ?? false;

  const addService = () => setServices([...services, { name: "", durationMinutes: 30 }]);
  const removeService = (i: number) => {
    if (services.length > 1) setServices(services.filter((_, idx) => idx !== i));
  };
  const updateService = (i: number, field: keyof ServiceItem, val: string | number) => {
    const updated = [...services];
    (updated[i] as any)[field] = val;
    setServices(updated);
  };

  const handleContinue = async (skip = false) => {
    const validServices = skip ? [] : services.filter((s) => s.name.trim());
    if (!skip && needsAgenda && validServices.length === 0) {
      setError("Adicione pelo menos um serviço para este bot de agenda.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/step3", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          services: validServices,
          openingHours: openingHours || null,
          address: address || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/onboarding/step/4");
      } else {
        setError(data.error || "Erro ao salvar");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando...</div>
  );

  return (
    <div>
      <StepProgress current={3} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <h2 className="text-xl font-bold text-gray-900">⚙️ Configuração Operacional</h2>
          <p className="text-sm text-gray-500 mt-1">
            {step3Data?.botName
              ? `Configure a operação do ${step3Data.botName}`
              : "Configure a operação do seu bot"}
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* Operational hours — always shown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Atendimento</label>
            <input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 08:00-12:00"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">A IA usará este horário para informar os clientes.</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 – São Paulo, SP"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
            />
          </div>

          {/* Agenda bots: show services */}
          {needsAgenda && (
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Serviços Oferecidos</label>
              <p className="text-xs text-gray-400 mb-3">
                Cadastre os serviços do seu negócio. O bot os usará para agendamento automático.
              </p>
              <div className="space-y-3">
                {services.map((svc, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <input
                      value={svc.name}
                      onChange={(e) => updateService(i, "name", e.target.value)}
                      placeholder={`Serviço ${i + 1}`}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={svc.durationMinutes}
                        onChange={(e) => updateService(i, "durationMinutes", parseInt(e.target.value) || 30)}
                        className="w-16 px-2 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center"
                      />
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addService}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                >
                  + Adicionar serviço
                </button>
              </div>
            </div>
          )}

          {/* Catalog bots: show CTA */}
          {needsCatalog && !needsAgenda && (
            <div className="pt-4 border-t border-gray-100">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-1">🛒 Este bot usa o Catálogo de Produtos</p>
                <p className="text-xs text-blue-600 mb-3">
                  Seu bot está configurado para vender produtos. Cadastre seu catálogo no painel para a IA apresentar corretamente.
                </p>
                <Link
                  href="/dashboard/vendas"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Gerenciar Catálogo →
                </Link>
              </div>
            </div>
          )}

          {/* No bot active */}
          {!needsAgenda && !needsCatalog && !step3Data?.activeBotKey && (
            <div className="pt-4 border-t border-gray-100">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">💡 Sem bot ativo</p>
                <p className="text-xs text-gray-500 mt-1">
                  Você pode ativar um bot especializado depois nas Configurações → Central de IA.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push("/onboarding/step/2")}
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleContinue(true)}
                className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pular por agora
              </button>
              <button
                type="button"
                onClick={() => handleContinue(false)}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Continuar →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Bot + Negócio" },
    { n: 2, label: "WhatsApp" },
    { n: 3, label: "Operação" },
    { n: 4, label: "IA" },
    { n: 5, label: "Teste" },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step.n < current
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                  : step.n === current
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.n < current ? "✓" : step.n}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${
                step.n <= current ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 rounded-full ${
                step.n < current ? "bg-emerald-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
