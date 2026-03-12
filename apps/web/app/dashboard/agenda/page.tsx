"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

type Appointment = {
    id: string;
    customerPhone: string;
    customerName: string | null;
    service: string;
    date: string;
    time: string;
    status: string; // scheduled, confirmed, cancelled
};

export default function AgendaPage() {
    const { user } = useAuth();
    const tenantId = user?.tenantId;
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAppointments = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/appointments?tenantId=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [tenantId]);

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Deseja alterar o status para: ${newStatus}?`)) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, status: newStatus })
            });
            if (res.ok) {
                loadAppointments();
            } else {
                alert("Erro ao atualizar o status.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><ClockIcon className="w-3.5 h-3.5" /> Agendado</span>;
            case 'confirmed':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircleIcon className="w-3.5 h-3.5" /> Confirmado</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-3.5 h-3.5" /> Cancelado</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agenda Digital</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Visualize e gerencie todos os agendamentos realizados pela Inteligência Artificial.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                    <div className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider items-center">
                            <div className="col-span-3">Cliente</div>
                            <div className="col-span-3">Serviço / Data</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-3 text-right">Ações Rápidas</div>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-gray-500 text-sm">Carregando agendamentos...</div>
                        ) : appointments.length === 0 ? (
                            <div className="px-6 py-16 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <ClockIcon className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Nenhum agendamento ainda</h3>
                                <p className="text-gray-500 mt-1 max-w-sm text-sm">
                                    A sua Inteligência Artificial fará os agendamentos automaticamente via WhatsApp baseada nos Serviços que você cadastrou.
                                </p>
                            </div>
                        ) : (
                            appointments.map((appt) => (
                                <div key={appt.id} className="grid grid-cols-12 gap-4 items-center px-6 py-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="col-span-3">
                                        <div className="font-semibold text-sm text-gray-900">{appt.customerName || "Não Informado"}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{appt.customerPhone}</div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="font-medium text-sm text-gray-900">{appt.service}</div>
                                        <div className="text-xs text-gray-500 font-medium mt-0.5">{appt.date} às {appt.time}</div>
                                    </div>
                                    <div className="col-span-3">
                                        {getStatusBadge(appt.status)}
                                    </div>
                                    <div className="col-span-3 flex items-center justify-end gap-2">
                                        {appt.status === 'scheduled' && (
                                            <>
                                                <button 
                                                    onClick={() => updateStatus(appt.id, 'confirmed')} 
                                                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                >
                                                    Confirmar
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(appt.id, 'cancelled')} 
                                                    className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                        {appt.status !== 'scheduled' && (
                                            <button 
                                                onClick={() => updateStatus(appt.id, 'scheduled')} 
                                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Reabrir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
