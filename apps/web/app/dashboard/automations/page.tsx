"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type AutomationRule = {
    id: string;
    name: string;
    triggerType: string;
    triggerValue: string;
    matchType: string;
    responseType: string;
    responseText: string;
    active: boolean;
};

export default function AutomationsPage() {
    const { user } = useAuth();
    const tenantId = user?.tenantId;
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        triggerType: "keyword", // or "contains" (not highly used on frontend as matchType does the real job, but requested by user)
        triggerValue: "",
        matchType: "exact", // exact, contains
        responseType: "text", // text, template
        responseText: "",
    });

    const loadRules = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/automations?tenantId=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, [tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;

        try {
            const url = editingRule 
                ? `/api/automations/${editingRule.id}` 
                : `/api/automations`;
            const method = editingRule ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, ...formData, active: editingRule ? editingRule.active : true })
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingRule(null);
                setFormData({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
                loadRules();
            } else {
                alert("Erro ao salvar automação.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover esta regra de automação?")) return;
        try {
            const res = await fetch(`/api/automations/${id}?tenantId=${tenantId}`, { method: "DELETE" });
            if (res.ok) loadRules();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleActive = async (rule: AutomationRule) => {
        try {
            const res = await fetch(`/api/automations/${rule.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, active: !rule.active })
            });
            if (res.ok) loadRules();
        } catch (e) {
            console.error(e);
        }
    };

    const openEditModal = (rule: AutomationRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            triggerType: rule.triggerType,
            triggerValue: rule.triggerValue,
            matchType: rule.matchType,
            responseType: rule.responseType,
            responseText: rule.responseText,
        });
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Automações Rápidas</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Crie respostas automáticas por palavras-chave antes da IA ser acionada.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingRule(null);
                        setFormData({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4338ca] hover:shadow-lg hover:shadow-[#4f46e5]/20 transition-all focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nova Automação
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                    <div className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-3">Nome da Regra</div>
                            <div className="col-span-3">Palavra-Chave</div>
                            <div className="col-span-1">Tipo</div>
                            <div className="col-span-3">Resposta</div>
                            <div className="col-span-1 text-center">Status</div>
                            <div className="col-span-1 text-right">Ações</div>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-gray-500 text-sm">Carregando automações...</div>
                        ) : rules.length === 0 ? (
                            <div className="px-6 py-16 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Nenhuma automação cadastrada</h3>
                                <p className="text-gray-500 mt-1 max-w-sm text-sm">
                                    Reduza as chamadas da sua Inteligência Artificial definindo gatilhos para perguntas frequentes como "preço" ou "endereço".
                                </p>
                            </div>
                        ) : (
                            rules.map((rule) => (
                                <div key={rule.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="col-span-3">
                                        <div className="font-medium text-gray-900">{rule.name}</div>
                                    </div>
                                    <div className="col-span-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            "{rule.triggerValue}"
                                        </span>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="text-xs text-gray-500">
                                            {rule.matchType === 'exact' ? 'Exata' : 'Contém'}
                                        </span>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="text-sm text-gray-500 truncate pr-4" title={rule.responseText}>
                                            {rule.responseText}
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => toggleActive(rule)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 ${rule.active ? 'bg-[#4f46e5]' : 'bg-gray-200'}`}
                                            role="switch"
                                            aria-checked={rule.active}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(rule)} className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Criação / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingRule ? 'Editar Automação' : 'Nova Automação'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <PlusIcon className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nome da Regra</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Tabela de Preços"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Gatilho (Mensagem)</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: preço"
                                        value={formData.triggerValue}
                                        onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Correspondência</label>
                                    <select
                                        value={formData.matchType}
                                        onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all appearance-none"
                                    >
                                        <option value="exact">Mensagem exata</option>
                                        <option value="contains">Contém a palavra</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Resposta Automática</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="O que o sistema deve responder..."
                                    value={formData.responseText}
                                    onChange={(e) => setFormData({ ...formData, responseText: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400 resize-none"
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
                                    {editingRule ? 'Salvar Alterações' : 'Criar Automação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
