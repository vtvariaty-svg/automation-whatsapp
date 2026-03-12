"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

type Service = {
    id: string;
    name: string;
    durationMinutes: number;
    active: boolean;
};

export default function ServicesPage() {
    const { user } = useAuth();
    const tenantId = user?.tenantId;
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        durationMinutes: 30,
    });

    const loadServices = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/services?tenantId=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, [tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;

        try {
            const url = editingService 
                ? `/api/services/${editingService.id}` 
                : `/api/services`;
            const method = editingService ? "PATCH" : "POST";

            const payload = {
                tenantId,
                name: formData.name,
                durationMinutes: Number(formData.durationMinutes),
                active: editingService ? editingService.active : true
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingService(null);
                setFormData({ name: "", durationMinutes: 30 });
                loadServices();
            } else {
                alert("Erro ao salvar serviço.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este serviço?")) return;
        try {
            const res = await fetch(`/api/services/${id}?tenantId=${tenantId}`, { method: "DELETE" });
            if (res.ok) loadServices();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleActive = async (srv: Service) => {
        try {
            const res = await fetch(`/api/services/${srv.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, active: !srv.active })
            });
            if (res.ok) loadServices();
        } catch (e) {
            console.error(e);
        }
    };

    const openEditModal = (srv: Service) => {
        setEditingService(srv);
        setFormData({
            name: srv.name,
            durationMinutes: srv.durationMinutes,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Serviços</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie os tipos de serviços e sua duração média para o agendamento da IA.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingService(null);
                        setFormData({ name: "", durationMinutes: 30 });
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4338ca] hover:shadow-lg hover:shadow-[#4f46e5]/20 transition-all focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Novo Serviço
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                    <div className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-5">Nome do Serviço</div>
                            <div className="col-span-3">Duração (min)</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-2 text-right">Ações</div>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-gray-500 text-sm">Carregando...</div>
                        ) : services.length === 0 ? (
                            <div className="px-6 py-16 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">✂️</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Nenhum serviço cadastrado</h3>
                                <p className="text-gray-500 mt-1 max-w-sm text-sm">
                                    A Inteligência Artificial precisa saber quais serviços você presta para calcular horários na agenda. Adicione o primeiro.
                                </p>
                            </div>
                        ) : (
                            services.map((srv) => (
                                <div key={srv.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="font-medium text-gray-900">{srv.name}</div>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-600">
                                        {srv.durationMinutes} minutos
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <button
                                            onClick={() => toggleActive(srv)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 ${srv.active ? 'bg-[#4f46e5]' : 'bg-gray-200'}`}
                                            role="switch"
                                            aria-checked={srv.active}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${srv.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(srv)} className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(srv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <PlusIcon className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nome do Serviço</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Corte de Cabelo"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Duração (Minutos)</label>
                                <input
                                    required
                                    type="number"
                                    min="5"
                                    step="5"
                                    placeholder="30"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] shadow-sm hover:shadow-md transition-all"
                                >
                                    {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
