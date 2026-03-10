'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
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

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl">Configurações da Empresa</CardTitle>
          <CardDescription>Gerencie as informações principais do seu negócio utilizadas tanto no painel quanto pela automação.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Empresa</label>
            <Input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição do Negócio</label>
            <Textarea
              rows={3}
              value={config.businessDescription}
              onChange={(e) => setConfig({ ...config, businessDescription: e.target.value })}
              placeholder="Descreva o que sua empresa faz, principais valores..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone Comercial</label>
            <Input
              type="text"
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de Funcionamento</label>
            <Input
              type="text"
              value={config.openingHours}
              onChange={(e) => setConfig({ ...config, openingHours: e.target.value })}
              placeholder="Ex: Seg-Sex 08:00 - 18:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço de Operação</label>
            <Input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
