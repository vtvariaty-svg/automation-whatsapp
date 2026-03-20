"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ContactSearchInput } from "@/components/contacts/ContactSearchInput";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  billingType: string;
  customerName: string;
  customerPhone: string;
  invoiceUrl: string | null;
  description: string | null;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  orderId: string | null;
  appointmentId: string | null;
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   "Pendente",
  confirmed: "Confirmado",
  failed:    "Falhou",
  refunded:  "Reembolsado",
  canceled:  "Cancelado",
  overdue:   "Vencido",
};

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-700",
  refunded:  "bg-gray-100 text-gray-600",
  canceled:  "bg-gray-100 text-gray-600",
  overdue:   "bg-orange-100 text-orange-700",
};

const BILLING_LABEL: Record<string, string> = {
  PIX:         "PIX",
  BOLETO:      "Boleto",
  CREDIT_CARD: "Cartão",
  UNDEFINED:   "À escolha",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Modal "Nova Cobrança" ─────────────────────────────────────────────────────

interface NewChargeModalProps {
  token: string;
  onClose: () => void;
  onCreated: (p: Payment & { pixCopiaECola?: string; pixQrCodeBase64?: string }) => void;
  prefillOrderId?: string;
  prefillAppointmentId?: string;
  prefillCustomerName?: string;
  prefillCustomerPhone?: string;
  prefillAmount?: string;
  prefillContactId?: string;
  prefillConversationId?: string;
}

function NewChargeModal({ token, onClose, onCreated, prefillOrderId, prefillAppointmentId, prefillCustomerName, prefillCustomerPhone, prefillAmount, prefillContactId, prefillConversationId }: NewChargeModalProps) {
  const [name, setName] = useState(prefillCustomerName ?? "");
  const [phone, setPhone] = useState(prefillCustomerPhone ?? "");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [amount, setAmount] = useState(prefillAmount ? String(parseFloat(prefillAmount).toFixed(2)).replace(".", ",") : "");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(tomorrow());
  const [billingType, setBillingType] = useState("UNDEFINED");
  const [orderId, setOrderId] = useState(prefillOrderId ?? "");
  const [appointmentId, setAppointmentId] = useState(prefillAppointmentId ?? "");
  // contactId is resolved via ContactSearchInput or pre-filled from URL
  const [contactId, setContactId] = useState(prefillContactId ?? "");
  // conversationId is immutable context — not editable by user
  const conversationId = prefillConversationId ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount.replace(",", "."));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Valor inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerData: { name, phone, email: email || undefined, cpfCnpj: cpfCnpj || undefined },
          amount: amountNum,
          description:    description    || undefined,
          dueDate,
          billingType,
          orderId:        orderId        || undefined,
          appointmentId:  appointmentId  || undefined,
          contactId:      contactId      || undefined,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar cobrança");
      onCreated(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">Nova Cobrança</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Contact search */}
          <ContactSearchInput
            label="Buscar contato salvo (opcional)"
            placeholder="Digite nome ou telefone..."
            theme="dark"
            onSelect={(c) => {
              if (c.name)  setName(c.name);
              if (c.phone) setPhone(c.phone);
              if (c.email) setEmail(c.email);
              setContactId(c.id);
            }}
          />

          {/* Customer fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nome do cliente *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Telefone *</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11999999999"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">CPF/CNPJ</label>
              <input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Charge details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor (R$) *</label>
              <input
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150,00"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vencimento *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Consulta + exame"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Forma de pagamento</label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="UNDEFINED">À escolha do cliente</option>
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
              </select>
            </div>
          </div>

          {/* Optional links */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ID do Pedido (opcional)</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Vincular a pedido"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ID do Agendamento (opcional)</label>
              <input
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Vincular a agendamento"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Gerando..." : "Gerar cobrança"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment created modal (show link + PIX) ───────────────────────────────────

interface CreatedPaymentModalProps {
  payment: Payment & { pixCopiaECola?: string; pixQrCodeBase64?: string };
  onClose: () => void;
}

function CreatedPaymentModal({ payment, onClose }: CreatedPaymentModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">Cobrança gerada ✓</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Cobrança criada com sucesso. Envie o link abaixo ao cliente.
          </div>

          {payment.invoiceUrl && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Link de pagamento</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={payment.invoiceUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono truncate focus:outline-none"
                />
                <button
                  onClick={() => copy(payment.invoiceUrl!, setCopiedLink)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors whitespace-nowrap"
                >
                  {copiedLink ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {payment.pixCopiaECola && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">PIX Copia e Cola</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={payment.pixCopiaECola}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono truncate focus:outline-none"
                />
                <button
                  onClick={() => copy(payment.pixCopiaECola!, setCopiedPix)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors whitespace-nowrap"
                >
                  {copiedPix ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {payment.pixQrCodeBase64 && (
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-gray-400">QR Code PIX</label>
              <img
                src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
                alt="QR Code PIX"
                className="w-48 h-48 rounded-lg border border-white/10"
              />
            </div>
          )}

          <div className="text-xs text-gray-500 pt-1 space-y-0.5">
            <p>Valor: {formatCurrency(payment.amount)}</p>
            <p>Vencimento: {payment.dueDate}</p>
            {payment.orderId && <p>Pedido: {payment.orderId.slice(0, 8)}…</p>}
            {payment.appointmentId && <p>Agendamento: {payment.appointmentId.slice(0, 8)}…</p>}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page (inner — uses useSearchParams, must be inside Suspense) ─────────

function PaymentsContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // URL params from "Cobrar" / "Gerar cobrança" buttons in other modules
  const prefillOrderId        = searchParams.get("orderId")        ?? undefined;
  const prefillCustomerName   = searchParams.get("customerName")   ?? undefined;
  const prefillCustomerPhone  = searchParams.get("customerPhone")  ?? undefined;
  const prefillAmount         = searchParams.get("amount")         ?? undefined;
  const prefillContactId      = searchParams.get("contactId")      ?? undefined;
  const prefillConversationId = searchParams.get("conversationId") ?? undefined;
  const autoOpen              = searchParams.get("newCharge") === "1";

  const [showNewModal, setShowNewModal] = useState(autoOpen);
  const [createdPayment, setCreatedPayment] = useState<
    (Payment & { pixCopiaECola?: string; pixQrCodeBase64?: string }) | null
  >(null);

  const fetchPayments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom)     params.set("dateFrom", dateFrom);
    if (dateTo)       params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {}
    finally { setLoading(false); }
  }, [token, page, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  function handleCreated(p: Payment & { pixCopiaECola?: string; pixQrCodeBase64?: string }) {
    setShowNewModal(false);
    setCreatedPayment(p);
    fetchPayments();
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cobranças</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">{data.total} cobrança{data.total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/payments/config")}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            ⚙ Configurar Asaas
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            + Nova cobrança
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="overdue">Vencido</option>
          <option value="canceled">Cancelado</option>
          <option value="refunded">Reembolsado</option>
          <option value="failed">Falhou</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />

        {(statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : !data?.payments.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400">Nenhuma cobrança encontrada.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Criar primeira cobrança
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-gray-900 font-medium">{p.customerName}</p>
                    <p className="text-gray-400 text-xs">{p.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{BILLING_LABEL[p.billingType] ?? p.billingType}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.dueDate}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    {p.invoiceUrl ? (
                      <button
                        onClick={() => { navigator.clipboard.writeText(p.invoiceUrl!); }}
                        title={p.invoiceUrl}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs transition-colors"
                      >
                        Copiar link
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-gray-500 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewModal && token && (
        <NewChargeModal
          token={token}
          onClose={() => { setShowNewModal(false); router.replace("/dashboard/payments"); }}
          onCreated={handleCreated}
          prefillOrderId={prefillOrderId}
          prefillCustomerName={prefillCustomerName}
          prefillCustomerPhone={prefillCustomerPhone}
          prefillAmount={prefillAmount}
          prefillContactId={prefillContactId}
          prefillConversationId={prefillConversationId}
        />
      )}

      {createdPayment && (
        <CreatedPaymentModal
          payment={createdPayment}
          onClose={() => setCreatedPayment(null)}
        />
      )}
    </div>
  );
}

// ── Default export wrapped in Suspense (required by Next.js 15 for useSearchParams) ──

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
