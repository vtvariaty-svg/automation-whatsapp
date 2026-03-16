"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    InboxArrowDownIcon,
    PaperAirplaneIcon,
    CpuChipIcon,
    UserIcon,
    ChatBubbleLeftRightIcon,
    CalendarDaysIcon,
    ArrowPathIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";

type AnalyticsData = {
    messages_inbound: number;
    messages_outbound: number;
    ai_responses: number;
    human_responses: number;
    new_conversations: number;
    appointments_created: number;
};

type SalesAnalyticsData = {
    sales_conversations: number;
    checkouts_generated: number;
    sales_completed: number;
    conversion_rate: number;
};

export default function AnalyticsPage() {
    const { user } = useAuth();
    const tenantId = user?.tenantId;
    const [period, setPeriod] = useState("today"); // today, 7days, 30days
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [salesData, setSalesData] = useState<SalesAnalyticsData | null>(null);

    const loadAnalytics = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [res, salesRes] = await Promise.all([
                fetch(`/api/analytics?tenantId=${tenantId}&period=${period}`),
                fetch(`/api/analytics/sales?tenantId=${tenantId}&period=${period}`)
            ]);
            if (res.ok) setData(await res.json());
            if (salesRes.ok) setSalesData(await salesRes.json());
        } catch (e) {
            console.error("Erro ao carregar analytics", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [tenantId, period]);

    const stats = [
        {
            name: "Mensagens Recebidas",
            value: data?.messages_inbound ?? 0,
            icon: InboxArrowDownIcon,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            name: "Mensagens Enviadas",
            value: data?.messages_outbound ?? 0,
            icon: PaperAirplaneIcon,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            name: "Respostas da IA",
            value: data?.ai_responses ?? 0,
            icon: CpuChipIcon,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            name: "Respostas Humanas",
            value: data?.human_responses ?? 0,
            icon: UserIcon,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            name: "Novas Conversas",
            value: data?.new_conversations ?? 0,
            icon: ChatBubbleLeftRightIcon,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            name: "Agendamentos",
            value: data?.appointments_created ?? 0,
            icon: CalendarDaysIcon,
            color: "text-rose-600",
            bg: "bg-rose-50",
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Métricas & Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Acompanhe o desempenho do seu atendimento automatizado e equipe humana.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadAnalytics}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Atualizar dados"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                    </button>
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1 inline-flex">
                        <button
                            onClick={() => setPeriod("today")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === "today" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setPeriod("7days")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === "7days" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            7 Dias
                        </button>
                        <button
                            onClick={() => setPeriod("30days")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === "30days" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            30 Dias
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${loading ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                            <div className={`p-2 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                                {loading ? "..." : stat.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 flex gap-4 items-start">
                <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
                    <CpuChipIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Resumo do Período</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Neste intervalo, a sua Inteligência Artificial lidou com
                        <strong className="text-indigo-600 mx-1">{(data?.ai_responses ?? 0)}</strong>
                        das <strong className="text-gray-900 mx-1">{(data?.messages_outbound ?? 0)}</strong>
                        mensagens disparadas, representando uma economia de tempo e eficiência imensurável para sua equipe.
                    </p>
                </div>
            </div>

            {/* Sales Analytics Section */}
            <div className="mt-10">
                <div className="mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Métricas de Vendas</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Funil de vendas gerado pela automação no período selecionado.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${loading ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Conversas de Venda</h3>
                            <div className="p-2 rounded-xl bg-sky-50">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-sky-600" />
                            </div>
                        </div>
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            {loading ? "..." : (salesData?.sales_conversations ?? 0)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">Leads que entraram no funil</p>
                    </div>

                    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${loading ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Checkouts Gerados</h3>
                            <div className="p-2 rounded-xl bg-violet-50">
                                <ShoppingCartIcon className="w-5 h-5 text-violet-600" />
                            </div>
                        </div>
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            {loading ? "..." : (salesData?.checkouts_generated ?? 0)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">Links de pagamento enviados</p>
                    </div>

                    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${loading ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Vendas Concluídas</h3>
                            <div className="p-2 rounded-xl bg-emerald-50">
                                <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            {loading ? "..." : (salesData?.sales_completed ?? 0)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">Pagamentos confirmados</p>
                    </div>

                    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${loading ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500">Taxa de Conversão</h3>
                            <div className="p-2 rounded-xl bg-orange-50">
                                <FunnelIcon className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            {loading ? "..." : `${salesData?.conversion_rate ?? 0}%`}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">Vendas / checkouts gerados</p>
                    </div>
                </div>

                <div className="mt-6 bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50 flex gap-4 items-start">
                    <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Resumo de Vendas</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            Neste período,{" "}
                            <strong className="text-sky-600">{salesData?.sales_conversations ?? 0}</strong> leads
                            {" "}entraram no funil.{" "}
                            <strong className="text-violet-600">{salesData?.checkouts_generated ?? 0}</strong> checkouts
                            {" "}foram gerados e{" "}
                            <strong className="text-emerald-600">{salesData?.sales_completed ?? 0}</strong> vendas
                            {" "}foram confirmadas, resultando em uma taxa de conversão de{" "}
                            <strong className="text-orange-600">{salesData?.conversion_rate ?? 0}%</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
