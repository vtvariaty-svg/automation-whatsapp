'use client';

import { useEffect, useState } from 'react';
import { Search, Building, CreditCard, Box, Save, X } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  operationalStatus: string;
  _count: { users: number };
  subscription?: { plan: string; status: string; currentPeriodEnd: string } | null;
}

export default function SuperAdminTenants() {
  const [tenants, setTenants] = planState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [overrideModal, setOverrideModal] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [newLimits, setNewLimits] = useState('{}');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/tenants?search=${search}&limit=50`);
      const json = await res.json();
      if (json.data) setTenants(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchTenants(), 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;
    
    let parsedLimits = undefined;
    if (newLimits.trim() !== '' && newLimits !== '{}') {
      try {
        parsedLimits = JSON.parse(newLimits);
      } catch (err) {
        alert('JSON de limites inválido.');
        return;
      }
    }

    try {
      const res = await fetch(`/api/superadmin/tenants/${overrideModal.id}/override-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan, entitlementsOverride: parsedLimits })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
        return;
      }
      setOverrideModal(null);
      fetchTenants();
      alert('Plano atualizado com sucesso e logado na auditoria.');
    } catch (err) {
      alert('Falha na requisição');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenants & Billing</h1>
        <p className="text-slate-500">Controle rigoroso dos planos de empresas e limites sobrepostos.</p>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tenant por nome ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Workspace / Tenant</th>
                <th className="px-6 py-4">Usuários</th>
                <th className="px-6 py-4">Plano Atual</th>
                <th className="px-6 py-4">Status Integração</th>
                <th className="px-6 py-4">Criado em</th>
                <th className="px-6 py-4 text-right">Ação Restrita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tenants.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando...</td></tr>
              ) : tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 flex items-center space-x-2">
                      <Building className="h-4 w-4 text-slate-400"/>
                      <span>{tenant.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{tenant.id}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {tenant._count.users}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                      {tenant.subscription?.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {tenant.operationalStatus || 'ACTIVE'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setOverrideModal(tenant);
                        setNewPlan(tenant.subscription?.plan || 'pro');
                      }}
                      className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 w-full max-w-[140px] ml-auto"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Override</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Box className="h-5 w-5 text-amber-500" />
                <h2 className="font-bold text-lg">Billing Override (Manual)</h2>
              </div>
              <button onClick={() => setOverrideModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleOverride} className="p-6 space-y-6 text-left">
              <div className="bg-amber-50 p-4 rounded-lg flex items-start space-x-3 text-amber-800 border border-amber-200">
                <CreditCard className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  Atenção: Modificar campos aqui injeta limites autoritários na assinatura ({overrideModal.name}). 
                  Esta ação burla a API do provedor (Stripe). O evento será rigidamente auditado com o seu ID.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Novo Plano Base</label>
                  <select 
                    value={newPlan} 
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none bg-white"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Entitlements Override (JSON)</label>
                  <p className="text-xs text-slate-500 mb-2">Se vazio ou {}, os limites seguirão o standard do plano. Suporte para {"{"}"aiLimit": 5000{"}"}</p>
                  <textarea
                    value={newLimits}
                    onChange={(e) => setNewLimits(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono text-sm bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setOverrideModal(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Aplicar Override Definitivo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para gerenciar o state corretamente
function planState<T>(initial: T) {
  return useState<T>(initial);
}
