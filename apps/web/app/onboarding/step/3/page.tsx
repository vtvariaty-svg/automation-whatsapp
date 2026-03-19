"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";



interface ServiceItem {
  name: string;
  durationMinutes: number;
}

export default function OnboardingStep3() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([{ name: "", durationMinutes: 30 }]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load services that might have been created by the Step 1 template
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        // We'll create a quick GET endpoint below to fetch tenant services
        const res = await fetch("/api/onboarding/step3", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.services && data.services.length > 0) {
            setServices(data.services.map((s: any) => ({ name: s.name, durationMinutes: s.durationMinutes })));
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addService = () => {
    setServices([...services, { name: "", durationMinutes: 30 }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string | number) => {
    const updated = [...services];
    (updated[index] as any)[field] = value;
    setServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validServices = services.filter(s => s.name.trim());
    if (validServices.length === 0) { setError("Adicione pelo menos um serviço"); return; }
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/step3", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ services: validServices }),
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

  if (loading) return <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando serviços...</div>;

  return (
    <div>
      <StepProgress current={3} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <h2 className="text-xl font-bold text-gray-900">📋 Serviços</h2>
          <p className="text-sm text-gray-500 mt-1">Revise ou cadastre os serviços que sua empresa oferece</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-2">
            <p className="text-sm font-semibold text-indigo-700">💡 Pré-configuramos alguns serviços para você!</p>
            <p className="text-xs text-indigo-600/80 mt-1">Eles foram gerados com base no tipo de negócio que você escolheu. Sinta-se à vontade para editar, excluir ou adicionar novos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                    className="w-16 px-2 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >✕</button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
            >
              + Adicionar outro serviço
            </button>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push("/onboarding/step/2")}
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
              >
                {saving ? <span>Salvando...</span> : <span>Continuar →</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Empresa" }, { n: 2, label: "WhatsApp" },
    { n: 3, label: "Serviços" }, { n: 4, label: "IA" }, { n: 5, label: "Teste" },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step.n < current ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
              : step.n === current ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-gray-100 text-gray-400"
            }`}>{step.n < current ? "✓" : step.n}</div>
            <span className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${step.n <= current ? "text-gray-700" : "text-gray-400"}`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step.n < current ? "bg-emerald-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}
