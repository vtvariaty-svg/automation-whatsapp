"use client";

import { useState } from "react";

interface RescheduleDialogProps {
  isOpen: boolean;
  appointment: { id: string; service?: string | null; date?: string | null; time?: string | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleDialog({ isOpen, appointment, onClose, onSuccess }: RescheduleDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reschedule", date, time }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao remarcar");
      }
      onSuccess();
      onClose();
      setDate(""); setTime("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Remarcar Agendamento</h2>
        <p className="text-sm text-gray-500 mb-4">
          {appointment.service} — {appointment.date ? new Date(appointment.date).toLocaleDateString("pt-BR") : "?"} às {appointment.time}h
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova data</label>
              <input
                type="date"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input
                type="time"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none text-sm"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { onClose(); setDate(""); setTime(""); setError(""); }}
              className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] transition-colors disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
