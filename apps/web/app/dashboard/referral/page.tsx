'use client';

import { useEffect, useState } from 'react';

interface ReferralCode {
  id: string;
  tenantId: string;
  code: string;
  rewardType: string;
  rewardValue: number;
  active: boolean;
  createdAt: string;
}

interface Conversion {
  id: string;
  status: 'registered' | 'trialing' | 'paid';
  referredTenantId: string;
  referredTenantName: string;
  rewardApplied: boolean;
  createdAt: string;
  paidAt: string | null;
}

interface ReferralData {
  codes: ReferralCode[];
  totalConversions: number;
  paidConversions: number;
  pendingRewards: number;
  suggestedCode?: string;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}` };
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  discount: 'Desconto %',
  credit: 'Crédito R$',
  commission: 'Comissão %',
};

const STATUS_STYLES: Record<string, string> = {
  registered: 'bg-gray-500/20 text-gray-300 border-gray-500/20',
  trialing: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  paid: 'bg-green-500/20 text-green-300 border-green-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  registered: 'Cadastrado',
  trialing: 'Em Trial',
  paid: 'Pago',
};

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state for creating a new code
  const [newRewardType, setNewRewardType] = useState('discount');
  const [newRewardValue, setNewRewardValue] = useState<number>(10);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [referralRes, convRes] = await Promise.all([
        fetch('/api/referral', { headers: authHeaders() }),
        fetch('/api/referral/conversions', { headers: authHeaders() }),
      ]);

      if (!referralRes.ok) {
        const d = await referralRes.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${referralRes.status}`);
      }

      const referralData: ReferralData = await referralRes.json();
      setData(referralData);

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversions(convData.conversions ?? []);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreateCode() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardType: newRewardType, rewardValue: newRewardValue }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar código');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(code: ReferralCode) {
    setToggling(true);
    setError(null);
    try {
      const res = await fetch('/api/referral', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId: code.id, active: !code.active }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao atualizar código');
    } finally {
      setToggling(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const activeCode = data?.codes.find((c) => c.active) ?? data?.codes[0] ?? null;
  const referralLink = activeCode
    ? `https://app.variaty.com.br/signup?ref=${activeCode.code}`
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programa de Indicação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Indique clientes e ganhe recompensas a cada conversão
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* No code — create section */}
      {(!data || data.codes.length === 0) && (
        <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Crie seu link de indicação</h2>
          {data?.suggestedCode && (
            <p className="text-sm text-gray-400">
              Código sugerido:{' '}
              <span className="font-mono text-indigo-400">{data.suggestedCode}</span>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Tipo de Recompensa
              </label>
              <select
                value={newRewardType}
                onChange={(e) => setNewRewardType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              >
                <option value="discount">Desconto %</option>
                <option value="credit">Crédito R$</option>
                <option value="commission">Comissão %</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Valor da Recompensa
              </label>
              <input
                type="number"
                min={0}
                value={newRewardValue}
                onChange={(e) => setNewRewardValue(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                placeholder={newRewardType === 'credit' ? 'R$' : '%'}
              />
            </div>
          </div>
          <button
            onClick={handleCreateCode}
            disabled={creating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Criar Link'}
          </button>
        </div>
      )}

      {/* Code exists — display section */}
      {activeCode && (
        <>
          {/* Code card */}
          <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-white">Seu Código de Indicação</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    activeCode.active
                      ? 'bg-green-500/20 text-green-300 border-green-500/20'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/20'
                  }`}
                >
                  {activeCode.active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => handleToggleActive(activeCode)}
                  disabled={toggling}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all disabled:opacity-50"
                >
                  {toggling ? '...' : activeCode.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>

            {/* Large code display */}
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-5 py-4 border border-white/[0.06]">
              <span className="font-mono text-3xl font-bold text-white tracking-widest flex-1">
                {activeCode.code}
              </span>
              <button
                onClick={() => copyToClipboard(activeCode.code, 'code')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-all"
              >
                {copied === 'code' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Referral link */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Link de Indicação
              </p>
              <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                <span className="text-sm text-indigo-300 font-mono flex-1 truncate">
                  {referralLink}
                </span>
                <button
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-all"
                >
                  {copied === 'link' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Reward badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
              <span>
                {activeCode.rewardValue}
                {activeCode.rewardType === 'credit' ? ' R$' : '%'} de{' '}
                {REWARD_TYPE_LABELS[activeCode.rewardType] ?? activeCode.rewardType} por conversão
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Indicações</p>
              <p className="text-2xl font-bold text-white">{data?.totalConversions ?? 0}</p>
            </div>
            <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Em Trial</p>
              <p className="text-2xl font-bold text-blue-400">
                {conversions.filter((c) => c.status === 'trialing').length}
              </p>
            </div>
            <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Convertidos</p>
              <p className="text-2xl font-bold text-green-400">{data?.paidConversions ?? 0}</p>
            </div>
            <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recomp. Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{data?.pendingRewards ?? 0}</p>
            </div>
          </div>
        </>
      )}

      {/* Conversions table */}
      {activeCode && (
        <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Histórico de Indicações</h2>
          </div>
          {conversions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Nenhuma indicação registrada ainda. Compartilhe seu link!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recompensa
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {conversions.map((conv) => (
                    <tr key={conv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{conv.referredTenantName}</p>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                          {conv.referredTenantId.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            STATUS_STYLES[conv.status] ?? STATUS_STYLES.registered
                          }`}
                        >
                          {STATUS_LABELS[conv.status] ?? conv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {conv.status === 'paid' ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                              conv.rewardApplied
                                ? 'bg-green-500/20 text-green-300 border-green-500/20'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20'
                            }`}
                          >
                            {conv.rewardApplied ? 'Aplicada' : 'Pendente'}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Como funciona */}
      <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              icon: '🔗',
              title: 'Compartilhe',
              desc: 'Envie seu link de indicação para amigos e clientes',
            },
            {
              step: '2',
              icon: '✍️',
              title: 'Cliente assina',
              desc: 'O indicado se cadastra usando seu código e assina um plano',
            },
            {
              step: '3',
              icon: '🎁',
              title: 'Ganhe recompensa',
              desc: 'Você recebe sua recompensa automaticamente a cada conversão paga',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center gap-2 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xl">
                {item.icon}
              </div>
              <p className="text-white font-semibold text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
