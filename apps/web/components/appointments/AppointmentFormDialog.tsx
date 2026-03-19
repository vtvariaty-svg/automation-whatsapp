"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface AppointmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

export function AppointmentFormDialog({ isOpen, onClose, onSuccess, tenantId }: AppointmentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    service: "",
    date: "",
    time: "",
    status: "agendado",
  });
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tenantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar agendamento");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Novo Agendamento</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Ex: Maria Oliveira"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (Whatsapp)</label>
            <input
              type="text"
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="Ex: 5511999999999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
            <input
              type="text"
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="Ex: Corte de Cabelo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input
                type="time"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all bg-white"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white"
              disabled={loading}
            >
              {loading ? <span>Salvando...</span> : <span>Criar Agendamento</span>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
