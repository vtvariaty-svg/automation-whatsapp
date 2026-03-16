'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` };
}

interface Agency {
  id: string;
  name: string;
  billingMode: string;
  primaryColor: string | null;
  logoUrl: string | null;
  memberCount: number;
  tenantCount: number;
}

interface SubTenant {
  id: string;
  name: string;
  isDemo: boolean;
  subscription: { plan: string; status: string } | null;
  enabledChannels: string | null;
  setupCompleted: boolean;
}

interface AgencyMember {
  id: string;
  userId: string;
  role: string;
}

interface PerformanceRow {
  tenantId: string;
  tenantName: string;
  plan: string;
  conversations: number;
  messages: number;
  automationsActive: number;
  leads: number;
  setupCompleted: boolean;
}

// ─── Plan badge ───────────────────────────────────────────────────────────────
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

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
}

// ─── Create Agency Form ───────────────────────────────────────────────────────
function CreateAgencyForm({ onCreated }: { onCreated: (agency: Agency) => void }) {
  const [name, setName] = useState('');
  const [billingMode, setBillingMode] = useState('separate');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, billingMode, primaryColor }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao criar agência');
      }
      const agency = await res.json();
      onCreated(agency);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta de Agência</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Configure sua conta de agência para gerenciar sub-contas de clientes.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Agência</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Minha Agência Digital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Cobrança</label>
            <select
              value={billingMode}
              onChange={(e) => setBillingMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="separate">Separado (cada cliente paga individualmente)</option>
              <option value="consolidated">Consolidado (agência paga por todos)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-16 border border-gray-300 rounded-lg cursor-pointer"
              />
              <span className="text-sm text-gray-500">{primaryColor}</span>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Agência'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── New Sub-tenant Modal ─────────────────────────────────────────────────────
function NewSubTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (result: { tenant: SubTenant; tempPassword: string; loginEmail: string }) => void;
}) {
  const [tenantName, setTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [plan, setPlan] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agency/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ tenantName, adminEmail, plan }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao criar sub-conta');
      }
      const result = await res.json();
      onCreated(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova Sub-conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tenant</label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Cliente XYZ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email do Admin</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@cliente.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Created Sub-tenant Result ────────────────────────────────────────────────
function CreatedTenantCard({
  result,
  onDismiss,
}: {
  result: { tenant: SubTenant; tempPassword: string; loginEmail: string };
  onDismiss: () => void;
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-green-800">Sub-conta criada com sucesso!</p>
          <p className="text-sm text-green-700 mt-1">
            Tenant: <strong>{result.tenant.name}</strong>
          </p>
          <p className="text-sm text-green-700">
            Login: <strong>{result.loginEmail}</strong>
          </p>
          <p className="text-sm text-green-700">
            Senha temporária:{' '}
            <code className="bg-green-100 px-1 rounded font-mono">{result.tempPassword}</code>
          </p>
          <p className="text-xs text-green-600 mt-1">Compartilhe estas credenciais com o cliente.</p>
        </div>
        <button onClick={onDismiss} className="text-green-600 hover:text-green-800 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ agency, subTenants }: { agency: Agency; subTenants: SubTenant[] }) {
  const active = subTenants.filter((t) => t.subscription?.status === 'active').length;
  const trialing = subTenants.filter((t) => t.subscription?.status === 'trialing').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Informações da Agência</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Nome</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{agency.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Cobrança</p>
            <span className={`mt-0.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              agency.billingMode === 'consolidated'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {agency.billingMode === 'consolidated' ? 'Consolidado' : 'Separado'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Membros</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{agency.memberCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Sub-contas</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{agency.tenantCount}</p>
          </div>
          {agency.primaryColor && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cor Principal</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className="h-5 w-5 rounded border border-gray-200"
                  style={{ backgroundColor: agency.primaryColor }}
                />
                <span className="text-sm font-mono text-gray-700">{agency.primaryColor}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total sub-contas', value: subTenants.length, color: 'text-gray-900' },
          { label: 'Ativas', value: active, color: 'text-green-600' },
          { label: 'Em trial', value: trialing, color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-tenants Tab ──────────────────────────────────────────────────────────
function SubTenantsTab({ subTenants, onRefresh }: { subTenants: SubTenant[]; onRefresh: () => void }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    tenant: SubTenant;
    tempPassword: string;
    loginEmail: string;
  } | null>(null);

  function handleCreated(result: { tenant: SubTenant; tempPassword: string; loginEmail: string }) {
    setShowModal(false);
    setCreatedResult(result);
    onRefresh();
  }

  return (
    <div>
      {showModal && (
        <NewSubTenantModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
      {createdResult && (
        <CreatedTenantCard result={createdResult} onDismiss={() => setCreatedResult(null)} />
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-gray-900">Sub-contas ({subTenants.length})</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-indigo-700"
        >
          + Nova Sub-conta
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {subTenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhuma sub-conta ainda.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plano</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Canais</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Setup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subTenants.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/agency/tenants/${t.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.subscription ? <PlanBadge plan={t.subscription.plan} /> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {t.subscription ? <StatusBadge status={t.subscription.status} /> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.enabledChannels || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        t.setupCompleted ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                      title={t.setupCompleted ? 'Concluído' : 'Pendente'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/agency/members', { headers: authHeaders() });
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/agency/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId: newUserId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro ao adicionar membro');
      }
      setNewUserId('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remover este membro?')) return;
    await fetch('/api/agency/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ userId }),
    });
    await loadMembers();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Membros ({members.length})</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Carregando...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">Nenhum membro ainda.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Papel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-mono text-gray-700 text-xs">{m.userId}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Adicionar Membro</h4>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            required
            placeholder="User ID"
            className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {adding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────
function PerformanceTab() {
  const [period, setPeriod] = useState<'7days' | '30days'>('7days');
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/agency/performance?period=${period}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const sorted = Array.isArray(data)
            ? [...data].sort((a, b) => b.conversations - a.conversations)
            : [];
          setRows(sorted);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Performance</h3>
        <div className="flex gap-2">
          {(['7days', '30days'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === '7days' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhum dado disponível.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plano</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Conversas</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Mensagens</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Leads</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Automações</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Setup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.tenantId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.tenantName}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={row.plan} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.conversations}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.messages}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.leads}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.automationsActive}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.setupCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {row.setupCompleted ? 'Pronto' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgencyPage() {
  const [agency, setAgency] = useState<Agency | null | undefined>(undefined);
  const [subTenants, setSubTenants] = useState<SubTenant[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'subtenants' | 'members' | 'performance'>(
    'overview'
  );
  const [loadingTenants, setLoadingTenants] = useState(false);

  const loadAgency = useCallback(async () => {
    const res = await fetch('/api/agency', { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setAgency(data);
    } else {
      setAgency(null);
    }
  }, []);

  const loadSubTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const res = await fetch('/api/agency/tenants', { headers: authHeaders() });
      if (res.ok) setSubTenants(await res.json());
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    loadAgency();
  }, [loadAgency]);

  useEffect(() => {
    if (agency) loadSubTenants();
  }, [agency, loadSubTenants]);

  if (agency === undefined) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Carregando...
      </div>
    );
  }

  if (!agency) {
    return <CreateAgencyForm onCreated={(a) => setAgency(a as Agency)} />;
  }

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'subtenants', label: 'Sub-contas' },
    { id: 'members', label: 'Membros' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{agency.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Painel da Agência</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab agency={agency} subTenants={subTenants} />
      )}
      {activeTab === 'subtenants' && (
        <SubTenantsTab
          subTenants={subTenants}
          onRefresh={loadSubTenants}
        />
      )}
      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'performance' && <PerformanceTab />}
    </div>
  );
}
