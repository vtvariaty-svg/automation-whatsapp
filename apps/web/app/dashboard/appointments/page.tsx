"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-green-100 text-green-700 border-green-200",
  concluido: "bg-gray-100 text-gray-700 border-gray-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    if (!user?.tenantId) return;
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/appointments?tenantId=${user.tenantId}`);
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
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, tenantId: user?.tenantId }),
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

  // Helper function to sort appointments by Date/Time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return timeA - timeB;
  });

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Serviços</h1>
          <p className="text-sm text-gray-500 mt-1">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Serviço</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Carregando agenda...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">⚠️</span></div>
                    <p className="text-sm font-medium text-gray-500">Erro ao carregar agendamentos</p>
                    <button onClick={fetchAppointments} className="mt-3 px-4 py-2 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
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
                    <td className="px-6 py-4 text-gray-700">{app.service}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border border-transparent outline-none cursor-pointer appearance-none text-center ${statusColors[app.status] || statusColors.agendado}`}
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="agendado" className="bg-white text-gray-900 text-left">Agendado</option>
                        <option value="confirmado" className="bg-white text-gray-900 text-left">Confirmado</option>
                        <option value="concluido" className="bg-white text-gray-900 text-left">Concluído</option>
                        <option value="cancelado" className="bg-white text-gray-900 text-left">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppointmentFormDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchAppointments}
        tenantId={user?.tenantId || ""}
      />
    </div>
  );
}
