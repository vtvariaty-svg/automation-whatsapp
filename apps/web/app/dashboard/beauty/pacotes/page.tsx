"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEntitlements } from "@/hooks/useEntitlements";
import UpgradeGate from "@/components/UpgradeGate";

interface PackageItem {
  serviceId: string;
  quantity: number;
}

interface BeautyPackage {
  id: string;
  name: string;
  description: string | null;
  totalSessions: number;
  priceTotal: number;
  validityDays: number;
  active: boolean;
  items: PackageItem[];
}

export default function BeautyPacotesPage() {
  const ent = useEntitlements();
  const [packages, setPackages] = useState<BeautyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    totalSessions: 10,
    priceTotal: 0,
    validityDays: 90,
  });

  useEffect(() => {
    fetch("/api/beauty/packages")
      .then((r) => r.json())
      .then((data) => {
        setPackages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (ent.loading) return null;
  if (!ent.features.beautyWorkspace) {
    return (
      <UpgradeGate
        icon="🎁"
        title="Pacotes de Serviços"
        message="Crie e gerencie pacotes de sessões para seus clientes. Disponível a partir do plano Pro."
        ctaPlan="Pro"
      />
    );
  }

  const handleCreate = async () => {
    if (!form.name || !form.priceTotal) return;
    setCreating(true);
    try {
      const res = await fetch("/api/beauty/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: [] }),
      });
      if (res.ok) {
        const pkg = await res.json();
        setPackages((prev) => [pkg, ...prev]);
        setShowForm(false);
        setForm({ name: "", description: "", totalSessions: 10, priceTotal: 0, validityDays: 90 });
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
        <span className="text-sm font-medium text-gray-900">Pacotes</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pacotes de serviços</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:shadow-md hover:shadow-violet-200/50 transition-all"
        >
          + Novo pacote
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Novo pacote</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Nome do pacote</label>
              <input
                type="text"
                placeholder="Ex: Pacote Coloração 10x"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sessões</label>
              <input
                type="number"
                min={1}
                value={form.totalSessions}
                onChange={(e) => setForm((f) => ({ ...f, totalSessions: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Preço total (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.priceTotal}
                onChange={(e) => setForm((f) => ({ ...f, priceTotal: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Validade (dias)</label>
              <input
                type="number"
                min={7}
                value={form.validityDays}
                onChange={(e) => setForm((f) => ({ ...f, validityDays: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating || !form.name}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-violet-700 transition-colors"
            >
              {creating ? "Criando..." : "Criar pacote"}
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
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum pacote criado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 hover:border-violet-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{pkg.name}</div>
                  {pkg.description && (
                    <div className="text-xs text-gray-400 mt-0.5">{pkg.description}</div>
                  )}
                </div>
                <span className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-full font-medium">
                  Ativo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="text-lg font-bold text-gray-800">{pkg.totalSessions}</div>
                  <div className="text-xs text-gray-400">sessões</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="text-sm font-bold text-gray-800">
                    R$ {pkg.priceTotal.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">total</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="text-sm font-bold text-gray-800">{pkg.validityDays}d</div>
                  <div className="text-xs text-gray-400">validade</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
