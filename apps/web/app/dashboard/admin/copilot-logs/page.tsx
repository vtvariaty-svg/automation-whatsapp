'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}`,
  };
}

interface Log {
  id: string; tenantId: string; question: string; answer: string;
  route: string | null; plan: string | null; role: string | null; confidence: string | null;
  fallbackNeeded: boolean; source: string | null; helpful: boolean | null;
  createdAt: string;
}
interface Stats { total: number; fallbackCount: number; resolutionRate: number; faqHits: number; }
interface RouteCount { route: string; count: number; }
interface PlanCount { plan: string; count: number; }

export default function CopilotLogsPage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [byRoute, setByRoute] = useState<RouteCount[]>([]);
  const [byPlan, setByPlan] = useState<PlanCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [onlyFallback, setOnlyFallback] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/copilot-logs?days=${days}&fallback=${onlyFallback}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setLogs(data.logs);
        setByRoute(data.byRoute);
        setByPlan(data.byPlan);
      }
    } finally {
      setLoading(false);
    }
  }, [days, onlyFallback]);

  useEffect(() => { load(); }, [load]);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-gray-500 font-medium">Acesso restrito a superadmins.</p>
        </div>
      </div>
    );
  }

  const confidenceBadge = (c: string | null) => {
    if (c === 'high') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">alta</span>;
    if (c === 'medium') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">média</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">baixa</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Copiloto de Suporte — Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Perguntas, resoluções e gaps de documentação</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>Hoje</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyFallback}
              onChange={(e) => setOnlyFallback(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Só fallbacks
          </label>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de perguntas', value: stats.total, color: 'text-indigo-600' },
            { label: 'Taxa de resolução', value: `${stats.resolutionRate}%`, color: 'text-emerald-600' },
            { label: 'Fallbacks (sem resposta boa)', value: stats.fallbackCount, color: 'text-red-500' },
            { label: 'Respondidas pelo FAQ', value: stats.faqHits, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top routes */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Rotas com mais dúvidas</h2>
          {byRoute.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado</p>
          ) : (
            <div className="space-y-2">
              {byRoute.map((r) => (
                <div key={r.route} className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-600 truncate max-w-[70%]">{r.route}</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By plan */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Dúvidas por plano</h2>
          {byPlan.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado</p>
          ) : (
            <div className="space-y-2">
              {byPlan.map((p) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{p.plan}</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Pergunta</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Rota</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Plano</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Confiança</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Fonte</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Nenhum log encontrado</td></tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.fallbackNeeded && <span className="text-red-500 text-xs font-bold shrink-0">⚠</span>}
                          <span className="text-gray-800 truncate max-w-[260px]">{log.question}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{log.route ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 capitalize">{log.plan ?? '—'}</td>
                      <td className="px-4 py-3">{confidenceBadge(log.confidence)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.source === 'faq' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {log.source ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-exp`} className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-xs space-y-2">
                            <div>
                              <p className="font-bold text-gray-500 mb-1">Resposta:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{log.answer}</p>
                            </div>
                            <p className="text-gray-400 font-mono">tenant: {log.tenantId} | role: {log.role}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
