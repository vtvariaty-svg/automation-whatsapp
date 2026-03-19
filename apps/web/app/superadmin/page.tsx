'use client';

import { useEffect, useState } from 'react';
import { Users, Building, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface OverviewData {
  totalUsers: number;
  totalTenants: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsers30d: number;
  planBreakdown: { plan: string; count: number }[];
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/overview');
      if (!res.ok) throw new Error('Falha ao carregar métricas');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-6 rounded-xl flex items-start space-x-3 text-red-600">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold">Erro de Conexão</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-1">Visão global da operação SaaS cross-tenant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Users" 
          value={data.totalUsers} 
          icon={<Users className="h-6 w-6 text-indigo-500" />}
          sub={`+${data.newUsers30d} últimos 30 dias`}
        />
        <MetricCard 
          title="Total Tenants" 
          value={data.totalTenants} 
          icon={<Building className="h-6 w-6 text-emerald-500" />}
          sub="Instâncias ativas"
        />
        <MetricCard 
          title="Ativos 24h" 
          value={data.activeUsers24h} 
          icon={<Activity className="h-6 w-6 text-amber-500" />}
          sub="Logins nas últimas 24 hrs"
        />
        <MetricCard 
          title="Ativos 30d" 
          value={data.activeUsers30d} 
          icon={<Activity className="h-6 w-6 text-blue-500" />}
          sub="MAU - Mensal Ativo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição de Planos</h3>
          <div className="space-y-4">
            {data.planBreakdown.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <span className="text-slate-600 capitalize font-medium">{item.plan}</span>
                <span className="bg-slate-100 text-slate-800 py-1 px-3 rounded-full text-sm font-bold">
                  {item.count} tenants
                </span>
              </div>
            ))}
            {data.planBreakdown.length === 0 && (
              <p className="text-slate-400 italic">Nenhum plano rastreado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, sub }: { title: string, value: number, icon: React.ReactNode, sub: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h3 className="text-slate-500 font-medium">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        <p className="text-sm text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}
