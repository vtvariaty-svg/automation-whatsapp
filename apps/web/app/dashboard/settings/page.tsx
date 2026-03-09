'use client';

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { authApi } from "@/lib/api/client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    name: "",
    businessDescription: "",
    phone: "",
    openingHours: "",
    address: ""
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await authApi.getTenantConfig();
        setConfig({
          name: data.name || "",
          businessDescription: data.businessDescription || "",
          phone: data.phone || "",
          openingHours: data.businessConfig?.openingHours || "",
          address: data.businessConfig?.address || ""
        });
      } catch (error) {
        console.error("Erro ao carregar configurações", error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateTenantConfig(config);
      alert("Configurações salvas!");
    } catch (error) {
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6">Configurações da Empresa</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Negócio</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            value={config.businessDescription}
            onChange={(e) => setConfig({ ...config, businessDescription: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            value={config.phone}
            onChange={(e) => setConfig({ ...config, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Funcionamento</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            value={config.openingHours}
            onChange={(e) => setConfig({ ...config, openingHours: e.target.value })}
            placeholder="Ex: Seg-Sex 08:00 - 18:00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            value={config.address}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
          />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
