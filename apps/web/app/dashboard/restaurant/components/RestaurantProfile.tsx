"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  whatsappPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryFeeDescription: string | null;
  minimumOrderValue: number | null;
  isPublished: boolean;
  menuPageConfig?: {
    heroTitle: string | null;
    heroSubtitle: string | null;
    primaryCtaLabel: string | null;
    showDeliveryInfo: boolean;
    showPickupInfo: boolean;
  } | null;
} | null;

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  return fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

export function RestaurantProfile() {
  const [profile, setProfile] = useState<Profile>(undefined as unknown as Profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    displayName: "", slug: "", description: "", whatsappPhone: "",
    address: "", city: "", state: "",
    acceptsDelivery: true, acceptsPickup: true,
    deliveryFeeDescription: "", minimumOrderValue: "",
    isPublished: false,
    heroTitle: "", heroSubtitle: "", primaryCtaLabel: "",
    showDeliveryInfo: true, showPickupInfo: true,
  });

  useEffect(() => {
    apiFetch("/restaurant/profile")
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        if (data) {
          const c = data.menuPageConfig;
          setForm({
            displayName: data.displayName ?? "",
            slug: data.slug ?? "",
            description: data.description ?? "",
            whatsappPhone: data.whatsappPhone ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            acceptsDelivery: data.acceptsDelivery ?? true,
            acceptsPickup: data.acceptsPickup ?? true,
            deliveryFeeDescription: data.deliveryFeeDescription ?? "",
            minimumOrderValue: data.minimumOrderValue?.toString() ?? "",
            isPublished: data.isPublished ?? false,
            heroTitle: c?.heroTitle ?? "",
            heroSubtitle: c?.heroSubtitle ?? "",
            primaryCtaLabel: c?.primaryCtaLabel ?? "",
            showDeliveryInfo: c?.showDeliveryInfo ?? true,
            showPickupInfo: c?.showPickupInfo ?? true,
          });
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        minimumOrderValue: form.minimumOrderValue ? Number(form.minimumOrderValue) : undefined,
      };
      const method = profile ? "PATCH" : "POST";
      const res = await apiFetch("/restaurant/profile", { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erro ao salvar." }); return; }
      setProfile(data);
      setMsg({ type: "ok", text: "Salvo com sucesso!" });
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const slug = form.slug || form.displayName?.toLowerCase().replace(/\s+/g, "-") || "seu-restaurante";

  return (
    <div className="space-y-6 max-w-2xl">
      {!profile && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          Nenhum perfil de restaurante criado ainda. Preencha os dados abaixo e clique em Salvar.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Dados do Restaurante</h2>
        <p className="text-xs text-gray-400">Configure os dados públicos do seu restaurante. Essa base será usada na futura página pública de cardápio.</p>
        <Field label="Nome do restaurante *" name="displayName" value={form.displayName} onChange={handleChange} placeholder="Ex: Pizzaria Bella Napoli" />
        <Field label="Slug (URL)" name="slug" value={form.slug} onChange={handleChange} placeholder="ex: pizzaria-bella-napoli" hint={`Página pública futura: /cardapio/${slug}`} />
        <Field label="WhatsApp de contato" name="whatsappPhone" value={form.whatsappPhone} onChange={handleChange} placeholder="+5511999999999" />
        <TextArea label="Descrição" name="description" value={form.description} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" name="city" value={form.city} onChange={handleChange} />
          <Field label="Estado" name="state" value={form.state} onChange={handleChange} placeholder="SP" />
        </div>
        <Field label="Endereço" name="address" value={form.address} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Taxa de entrega (descrição)" name="deliveryFeeDescription" value={form.deliveryFeeDescription} onChange={handleChange} placeholder="Ex: Grátis acima de R$50" />
          <Field label="Pedido mínimo (R$)" name="minimumOrderValue" value={form.minimumOrderValue} onChange={handleChange} placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Checkbox label="Aceita delivery" name="acceptsDelivery" checked={form.acceptsDelivery} onChange={handleChange} />
          <Checkbox label="Aceita retirada no local" name="acceptsPickup" checked={form.acceptsPickup} onChange={handleChange} />
          <Checkbox label="Cardápio público ativo (quando disponível)" name="isPublished" checked={form.isPublished} onChange={handleChange} />
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          Página pública futura: <code>/cardapio/{slug}</code> — será ativada na próxima fase.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Configuração da Página Pública</h2>
        <Field label="Título principal" name="heroTitle" value={form.heroTitle} onChange={handleChange} placeholder="Peça agora pelo WhatsApp" />
        <Field label="Subtítulo" name="heroSubtitle" value={form.heroSubtitle} onChange={handleChange} placeholder="Delivery rápido na sua região" />
        <Field label="Texto do botão CTA" name="primaryCtaLabel" value={form.primaryCtaLabel} onChange={handleChange} placeholder="Fazer pedido" />
        <div className="flex flex-col gap-2">
          <Checkbox label="Mostrar informações de entrega" name="showDeliveryInfo" checked={form.showDeliveryInfo} onChange={handleChange} />
          <Checkbox label="Mostrar informações de retirada" name="showPickupInfo" checked={form.showPickupInfo} onChange={handleChange} />
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !form.displayName}
        className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Salvando..." : profile ? "Atualizar perfil" : "Criar perfil"}
      </button>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, hint }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
    </div>
  );
}

function Checkbox({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
      {label}
    </label>
  );
}
