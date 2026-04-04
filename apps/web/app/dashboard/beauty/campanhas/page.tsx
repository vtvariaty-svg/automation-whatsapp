"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEntitlements } from "@/hooks/useEntitlements";
import UpgradeGate from "@/components/UpgradeGate";

interface CampaignRule {
  id: string;
  name: string;
  triggerType: string;
  inactivityDays: number | null;
  messageTemplate: string;
  channel: string;
  active: boolean;
  cooldownDays: number;
}

const TRIGGER_LABELS: Record<string, string> = {
  inactivity: "Inatividade",
  birthday: "Aniversário",
  post_visit: "Pós-visita",
  package_expiring: "Pacote expirando",
  loyalty_milestone: "Marco de fidelidade",
};

const TRIGGER_ICONS: Record<string, string> = {
  inactivity: "💤",
  birthday: "🎂",
  post_visit: "✅",
  package_expiring: "⏳",
  loyalty_milestone: "🏆",
};

export default function BeautyCampanhasPage() {
  const ent = useEntitlements();
  const [rules, setRules] = useState<CampaignRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    triggerType: "inactivity",
    inactivityDays: 30,
    messageTemplate: "",
    channel: "whatsapp",
    cooldownDays: 7,
  });

  useEffect(() => {
    fetch("/api/beauty/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setRules(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (ent.loading) return null;
  if (!ent.features.beautyWorkspace) {
    return (
      <UpgradeGate
        icon="📣"
        title="Campanhas de Retenção"
        message="Reengajamento automático para clientes inativos. Disponível a partir do plano Pro."
        ctaPlan="Pro"
      />
    );
  }

  const handleCreate = async () => {
    if (!form.name || !form.messageTemplate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/beauty/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const rule = await res.json();
        setRules((prev) => [rule, ...prev]);
        setShowForm(false);
        setForm({
          name: "",
          triggerType: "inactivity",
          inactivityDays: 30,
          messageTemplate: "",
          channel: "whatsapp",
          cooldownDays: 7,
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/beauty"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Beauty Workspace
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Campanhas</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campanhas de retenção</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Mensagens automáticas para reengajar e fidelizar clientes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:shadow-md hover:shadow-violet-200/50 transition-all"
        >
          + Nova campanha
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Nova campanha</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Nome</label>
              <input
                type="text"
                placeholder="Ex: Clientes inativos 30 dias"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gatilho</label>
              <select
                value={form.triggerType}
                onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {form.triggerType === "inactivity" && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Dias de inatividade</label>
                <input
                  type="number"
                  min={7}
                  value={form.inactivityDays}
                  onChange={(e) => setForm((f) => ({ ...f, inactivityDays: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cooldown entre envios (dias)</label>
              <input
                type="number"
                min={1}
                value={form.cooldownDays}
                onChange={(e) => setForm((f) => ({ ...f, cooldownDays: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Mensagem</label>
              <textarea
                rows={3}
                placeholder="Olá {{nome}}, sentimos sua falta! Que tal agendar um horário?"
                value={form.messageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Variáveis disponíveis: {"{{nome}}"}, {"{{dias_sem_visita}}"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.messageTemplate}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-violet-700 transition-colors"
            >
              {creating ? "Criando..." : "Criar campanha"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhuma campanha criada. Crie uma para começar a reengajar clientes automaticamente.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-violet-200 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 flex items-center justify-center text-lg">
                    {TRIGGER_ICONS[rule.triggerType] ?? "📣"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{rule.name}</div>
                    <div className="text-xs text-gray-400">
                      {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}
                      {rule.inactivityDays ? ` · ${rule.inactivityDays} dias` : ""}
                      {" · "}cooldown {rule.cooldownDays}d
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  rule.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {rule.active ? "Ativa" : "Pausada"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 font-mono leading-relaxed">
                {rule.messageTemplate}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
