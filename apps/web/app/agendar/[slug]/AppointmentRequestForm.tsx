"use client";

import { useState } from "react";

type Service = { id: string; name: string };
type Professional = { id: string; name: string; role: string | null };

type Props = {
  slug: string;
  clinicName: string;
  whatsappPhone: string;
  services: Service[];
  professionals: Professional[];
  showProfessionals: boolean;
};

type SuccessData = { whatsappUrl: string | null };

export function AppointmentRequestForm({
  slug,
  clinicName,
  whatsappPhone,
  services,
  professionals,
  showProfessionals,
}: Props) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    professionalId: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
    website: "", // honeypot — must stay empty
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/public/clinic/${slug}/appointment-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          serviceId: form.serviceId || undefined,
          professionalId: form.professionalId || undefined,
          preferredDate: form.preferredDate || undefined,
          preferredTime: form.preferredTime || undefined,
          notes: form.notes || undefined,
          website: form.website, // honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar. Tente novamente.");
        return;
      }

      setSuccess({ whatsappUrl: data.whatsappUrl ?? null });

      // Open WhatsApp automatically if URL available
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-teal-100 p-6 space-y-4 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="font-bold text-gray-900">Solicitação enviada!</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Seu pedido foi registrado como solicitação. A clínica ainda precisa confirmar o horário pelo WhatsApp.
        </p>
        {success.whatsappUrl && (
          <a
            href={success.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold text-sm px-6 py-3 rounded-full shadow hover:bg-teal-700 transition-colors"
          >
            <WhatsAppIcon />
            Continuar no WhatsApp
          </a>
        )}
        <button
          onClick={() => {
            setSuccess(null);
            setForm({
              customerName: "", customerPhone: "", customerEmail: "",
              serviceId: "", professionalId: "", preferredDate: "",
              preferredTime: "", notes: "", website: "",
            });
          }}
          className="block mx-auto text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          Enviar outra solicitação
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h3 className="font-bold text-gray-900">Solicitar agendamento</h3>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2 leading-relaxed">
          Use este formulário apenas para solicitação administrativa de atendimento. Não envie sintomas, exames, diagnósticos, prescrições ou informações clínicas sensíveis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot — hidden from real users */}
        <input
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome *" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Seu nome completo" required />
          <Field label="WhatsApp / Telefone *" name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="(11) 99999-0000" required />
        </div>

        <Field label="Email (opcional)" name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} placeholder="seu@email.com" />

        {services.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço desejado (opcional)</label>
            <select
              name="serviceId"
              value={form.serviceId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sem preferência</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {showProfessionals && professionals.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional preferido (opcional)</label>
            <select
              name="professionalId"
              value={form.professionalId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sem preferência</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data preferida (opcional)" name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} />
          <Field label="Horário preferido (opcional)" name="preferredTime" type="time" value={form.preferredTime} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação administrativa (opcional)
            <span className="text-gray-400 font-normal ml-1">— máx. 500 caracteres</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            placeholder="Ex: Tenho restrição de horário pela manhã. Não inclua dados clínicos."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Enviando..." : "Enviar solicitação"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Ao enviar, você concorda que seus dados serão usados apenas para contato de agendamento com {clinicName}.
        </p>
      </form>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Field({ label, name, value, onChange, placeholder, type = "text", required }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.115 1.527 5.845L.057 23.49a.75.75 0 0 0 .921.921l5.729-1.491A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.958-1.357l-.355-.212-3.659.953.975-3.562-.232-.368A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  );
}
