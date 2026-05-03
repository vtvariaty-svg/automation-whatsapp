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
  isPublished: boolean;
  bookingPageConfig?: {
    heroTitle: string | null;
    heroSubtitle: string | null;
    primaryCtaLabel: string | null;
    showPrices: boolean;
    showProfessionals: boolean;
    showAddress: boolean;
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

export default function ClinicProfile() {
  const [profile, setProfile] = useState<Profile>(undefined as unknown as Profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    displayName: "", slug: "", description: "", whatsappPhone: "",
    address: "", city: "", state: "", isPublished: false,
    heroTitle: "", heroSubtitle: "", primaryCtaLabel: "",
    showPrices: true, showProfessionals: true, showAddress: true,
  });

  useEffect(() => {
    apiFetch("/clinic/profile")
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        if (data) {
          const c = data.bookingPageConfig;
          setForm({
            displayName: data.displayName ?? "",
            slug: data.slug ?? "",
            description: data.description ?? "",
            whatsappPhone: data.whatsappPhone ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            isPublished: data.isPublished ?? false,
            heroTitle: c?.heroTitle ?? "",
            heroSubtitle: c?.heroSubtitle ?? "",
            primaryCtaLabel: c?.primaryCtaLabel ?? "",
            showPrices: c?.showPrices ?? true,
            showProfessionals: c?.showProfessionals ?? true,
            showAddress: c?.showAddress ?? true,
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
      const payload = { ...form };
      const method = profile ? "PATCH" : "POST";
      const res = await apiFetch("/clinic/profile", { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erro ao salvar." }); return; }
      setProfile(data);
      setMsg({ type: "ok", text: "Salvo com sucesso!" });
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const slug = form.slug || form.displayName?.toLowerCase().replace(/\s+/g, "-") || "seu-consultorio";

  return (
    <div className="space-y-6 max-w-2xl">
      {!profile && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
          Nenhum perfil de clínica criado ainda. Preencha os dados abaixo e clique em Salvar.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Dados da Clínica</h2>
        <Field label="Nome da clínica *" name="displayName" value={form.displayName} onChange={handleChange} placeholder="Ex: Clínica Bem Estar" />
        <Field label="Slug (URL)" name="slug" value={form.slug} onChange={handleChange} placeholder="ex: clinica-bem-estar" hint={`Página futura: /agendar/${slug}`} />
        <Field label="Telefone / WhatsApp" name="whatsappPhone" value={form.whatsappPhone} onChange={handleChange} placeholder="+5511999999999" />
        <TextArea label="Descrição" name="description" value={form.description} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" name="city" value={form.city} onChange={handleChange} />
          <Field label="Estado" name="state" value={form.state} onChange={handleChange} placeholder="SP" />
        </div>
        <Field label="Endereço" name="address" value={form.address} onChange={handleChange} />
        <Checkbox label="Página pública ativa (quando disponível)" name="isPublished" checked={form.isPublished} onChange={handleChange} />
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          Página pública futura: <code>/agendar/{slug}</code> — será ativada na próxima fase.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Configuração da Página Pública</h2>
        <Field label="Título do hero" name="heroTitle" value={form.heroTitle} onChange={handleChange} placeholder="Agende sua consulta online" />
        <Field label="Subtítulo" name="heroSubtitle" value={form.heroSubtitle} onChange={handleChange} placeholder="Rápido, fácil e sem ligação" />
        <Field label="Texto do botão CTA" name="primaryCtaLabel" value={form.primaryCtaLabel} onChange={handleChange} placeholder="Agendar agora" />
        <div className="flex flex-col gap-2">
          <Checkbox label="Mostrar preços" name="showPrices" checked={form.showPrices} onChange={handleChange} />
          <Checkbox label="Mostrar profissionais" name="showProfessionals" checked={form.showProfessionals} onChange={handleChange} />
          <Checkbox label="Mostrar endereço" name="showAddress" checked={form.showAddress} onChange={handleChange} />
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
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextArea({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
    </div>
  );
}

function Checkbox({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      {label}
    </label>
  );
}
