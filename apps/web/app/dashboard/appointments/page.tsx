"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { RescheduleDialog } from "@/components/appointments/RescheduleDialog";
import { SchedulingStatsBar } from "@/components/appointments/SchedulingStatsBar";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planAtLeast } from "@/lib/config/plans";
import UpgradeGate from "@/components/UpgradeGate";

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  status: string;
  source: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-green-100 text-green-700 border-green-200",
  concluido: "bg-gray-100 text-gray-700 border-gray-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
  no_show: "bg-orange-100 text-orange-700 border-orange-200",
};

const sourceIcons: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  facebook: "📘",
  manual: "✏️",
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAppointments = async () => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    if (!token) return;
    try {
      setLoading(true);
      setError(false);
      const res = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.tenantId]);

  const updateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCancelWithReason = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    try {
      const res = await fetch(`/api/appointments/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelado", reason: cancelReason || undefined }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: "cancelado" } : a))
        );
        setCancelTarget(null);
        setCancelReason("");
      }
    } catch (err) {
      console.error("Failed to cancel appointment", err);
    } finally {
      setCancelLoading(false);
    }
  };

  if (!ent.loading && !planAtLeast(ent.plan, 'standard')) {
    return <UpgradeGate icon="📅" title="Agenda de Atendimentos" message="Agendamento disponível a partir do plano Standard." ctaPlan="Standard" />;
  }

  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return timeA - timeB;
  });

  const isActive = (status: string) => ['agendado', 'confirmado'].includes(status);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Serviços</h1>
          <p className="text-sm text-gray-500 mt-1">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(s => !s)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${showStats ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Métricas
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Agendamento
          </button>
        </div>
      </div>

      {showStats && <SchedulingStatsBar />}

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Serviço</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Carregando agenda...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">⚠️</span></div>
                    <p className="text-sm font-medium text-gray-500">Erro ao carregar agendamentos</p>
                    <button onClick={fetchAppointments} className="mt-3 px-4 py-2 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">📅</span></div>
                    <p className="text-sm font-medium text-gray-500">Nenhum agendamento</p>
                    <p className="text-xs text-gray-400 mt-1">Os agendamentos dos clientes aparecerão aqui</p>
                  </td>
                </tr>
              ) : (
                sortedAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {app.date ? new Date(app.date).toLocaleDateString("pt-BR") : "S/ Data"}
                      </div>
                      <div className="text-xs text-[#4f46e5] mt-0.5">{app.time ? `${app.time}h` : "S/ Horário"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.customerName || "Cliente"}</div>
                      <div className="text-xs text-gray-500">{app.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">{app.service}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{sourceIcons[app.source] || "✏️"} {app.source || "manual"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border border-transparent outline-none cursor-pointer appearance-none text-center ${statusColors[app.status] || statusColors.agendado}`}
                        value={app.status}
                        onChange={(e) => {
                          if (e.target.value === "cancelado") { setCancelTarget(app); }
                          else updateStatus(app.id, e.target.value);
                        }}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="agendado" className="bg-white text-gray-900 text-left">Agendado</option>
                        <option value="confirmado" className="bg-white text-gray-900 text-left">Confirmado</option>
                        <option value="concluido" className="bg-white text-gray-900 text-left">Concluído</option>
                        <option value="cancelado" className="bg-white text-gray-900 text-left">Cancelado</option>
                        <option value="no_show" className="bg-white text-gray-900 text-left">Não compareceu</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isActive(app.status) && (
                        <button
                          onClick={() => setRescheduleTarget(app)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                        >
                          Remarcar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel with reason modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Cancelar Agendamento</h2>
            <p className="text-sm text-gray-500 mb-4">
              {cancelTarget.service} — {cancelTarget.date ? new Date(cancelTarget.date).toLocaleDateString("pt-BR") : "?"} às {cancelTarget.time}h
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                placeholder="Ex: Cliente pediu cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setCancelTarget(null); setCancelReason(""); }}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                disabled={cancelLoading}
              >
                Voltar
              </button>
              <button
                onClick={handleCancelWithReason}
                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppointmentFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAppointments}
        tenantId={user?.tenantId || ""}
      />

      <RescheduleDialog
        isOpen={!!rescheduleTarget}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
