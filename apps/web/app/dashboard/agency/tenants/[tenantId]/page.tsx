'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}` };
}

interface Subscription {
  plan: string;
  status: string;
  trialEnd: string | null;
}

interface TenantDetail {
  id: string;
  name: string;
  agencyBranding: boolean;
  enabledChannels: string | null;
  setupCompleted: boolean;
  isDemo: boolean;
  subscription: Subscription | null;
  stats: {
    conversations7d: number;
    messages7d: number;
    automationsActive: number;
  };
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-700',
    growth: 'bg-blue-100 text-blue-700',
    scale: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[plan] ?? 'bg-gray-100 text-gray-700'}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function SubTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBranding, setEditBranding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    params.then((p) => setTenantId(p.tenantId));
  }, [params]);

  const loadTenant = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/agency/tenants/${id}`, { headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao carregar tenant');
      }
      const data: TenantDetail = await res.json();
      setTenant(data);
      setEditName(data.name);
      setEditBranding(data.agencyBranding);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tenantId) loadTenant(tenantId);
  }, [tenantId, loadTenant]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/agency/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: editName, agencyBranding: editBranding }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao salvar');
      }
      setSaveMsg('Salvo com sucesso!');
      await loadTenant(tenantId);
    } catch (err: any) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link href="/dashboard/agency" className="text-indigo-600 hover:underline text-sm">
          Voltar para Agência
        </Link>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/agency"
          className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
        >
          ← Voltar para Agência
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{tenant.id}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tenant.subscription && (
              <>
                <PlanBadge plan={tenant.subscription.plan} />
                <StatusBadge status={tenant.subscription.status} />
              </>
            )}
            {tenant.isDemo && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                Demo
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Canais ativos:</span>{' '}
            <span className="font-medium text-gray-900">{tenant.enabledChannels || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Setup:</span>{' '}
            <span
              className={`font-medium ${
                tenant.setupCompleted ? 'text-green-600' : 'text-yellow-600'
              }`}
            >
              {tenant.setupCompleted ? 'Concluído' : 'Pendente'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Agency Branding:</span>{' '}
            <span className="font-medium text-gray-900">
              {tenant.agencyBranding ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Estatísticas (últimos 7 dias)</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Conversas', value: tenant.stats.conversations7d },
            { label: 'Mensagens', value: tenant.stats.messages7d },
            { label: 'Automações ativas', value: tenant.stats.automationsActive },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center"
            >
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Editar Sub-conta</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={editBranding}
              onClick={() => setEditBranding((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                editBranding ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  editBranding ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <label className="text-sm font-medium text-gray-700">Agency Branding</label>
          </div>
          {saveMsg && (
            <p
              className={`text-sm ${
                saveMsg.includes('sucesso') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {saveMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
