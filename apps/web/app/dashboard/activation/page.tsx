'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayPoint { date: string; conversations: number; messages: number; }

interface ActivationMetrics {
  period: string;
  channels: { whatsapp: boolean; instagram: boolean; facebook: boolean; total: number };
  automations_active: number;
  conversations_new: number;
  messages_inbound: number;
  messages_outbound: number;
  reply_rate: number;
  ai_messages: number;
  ai_tokens: number;
  leads_generated: number;
  dms_from_comments: number;
  qualified: number;
  appointments: number;
  checkouts_started: number;
  conversions: number;
  conversion_rate: number;
  activation: { tenant_age_days: number; in_window: boolean; day_by_day: DayPoint[] };
  alerts: { type: string; message: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '')
    : '';
  return { Authorization: `Bearer ${token}` };
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }
function pct(n: number) { return `${n}%`; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  emoji, label, value, sub, highlight = false,
}: { emoji: string; label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${highlight ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs font-medium text-gray-500 truncate">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-indigo-700' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-semibold text-gray-800">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DayChart({ data }: { data: DayPoint[] }) {
  const maxConv = Math.max(1, ...data.map((d) => d.conversations));
  const maxMsg = Math.max(1, ...data.map((d) => d.messages));
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => {
        const hConv = Math.max(4, Math.round((d.conversations / maxConv) * 80));
        const hMsg = Math.max(4, Math.round((d.messages / maxMsg) * 80));
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="w-full flex items-end gap-0.5 justify-center">
              <div
                className="flex-1 bg-indigo-400 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ height: `${hConv}px` }}
              />
              <div
                className="flex-1 bg-blue-200 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ height: `${hMsg}px` }}
              />
            </div>
            <span className="text-[9px] text-gray-400">{d.date}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 left-1/2 -translate-x-1/2">
              {d.date}: {d.conversations} conv · {d.messages} msgs
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivationPage() {
  const [period, setPeriod] = useState('7days');
  const [data, setData] = useState<ActivationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/activation?period=${period}`, { headers: authHeaders() });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const ALERT_COLORS: Record<string, string> = {
    no_channel:    'bg-red-50 border-red-200 text-red-800',
    no_activity:   'bg-amber-50 border-amber-200 text-amber-800',
    no_automations:'bg-yellow-50 border-yellow-200 text-yellow-800',
  };
  const ALERT_ICONS: Record<string, string> = {
    no_channel: '🔌', no_activity: '📭', no_automations: '⚡',
  };
  const ALERT_LINKS: Record<string, string> = {
    no_channel: '/dashboard/integrations',
    no_activity: '/dashboard/integrations',
    no_automations: '/dashboard/onboarding',
  };

  const funnelMax = data ? Math.max(data.leads_generated, data.qualified, data.appointments, data.checkouts_started, data.conversions, 1) : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativação & Receita</h1>
          <p className="text-gray-500 text-sm mt-0.5">Métricas que provam adoção e geração de valor.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-1 inline-flex self-start">
          {(['today','7days','30days'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === p ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {p === 'today' ? 'Hoje' : p === '7days' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data?.alerts.map((alert) => (
        <Link
          key={alert.type}
          href={ALERT_LINKS[alert.type] ?? '/dashboard'}
          className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-sm font-medium ${ALERT_COLORS[alert.type]} hover:opacity-90 transition-opacity`}
        >
          <span className="text-base">{ALERT_ICONS[alert.type]}</span>
          <span className="flex-1">{alert.message}</span>
          <span className="text-xs opacity-60">Corrigir →</span>
        </Link>
      ))}

      {/* Activation window banner */}
      {data?.activation.in_window && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg">🚀 Janela de ativação</p>
            <p className="text-indigo-200 text-sm mt-0.5">
              Dia <strong>{data.activation.tenant_age_days}</strong> de 7 — você está nos primeiros passos.
              {' '}Configure os canais e automações para ver os primeiros resultados.
            </p>
          </div>
          <Link href="/dashboard/onboarding" className="whitespace-nowrap text-xs font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
            Assistente →
          </Link>
        </div>
      )}

      {/* ── Section 1: Setup ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Configuração</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Channels */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔌</span>
              <span className="text-xs font-medium text-gray-500">Canais conectados</span>
            </div>
            <div className="flex gap-3">
              {[
                { key: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                { key: 'instagram', icon: '📸', label: 'Instagram' },
                { key: 'facebook', icon: '📘', label: 'Facebook' },
              ].map((ch) => {
                const connected = data?.channels[ch.key as keyof typeof data.channels] as boolean | undefined;
                return (
                  <div key={ch.key} className={`flex-1 flex flex-col items-center p-2 rounded-lg border ${loading ? 'opacity-40' : connected ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="text-xl mb-1">{ch.icon}</span>
                    <span className="text-[10px] font-medium text-gray-600">{ch.label}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${connected ? 'text-green-600' : 'text-gray-400'}`}>
                      {loading ? '…' : connected ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <MetricCard emoji="⚡" label="Automações ativas" value={loading ? '…' : fmt(data?.automations_active ?? 0)} sub="regras de keyword" />
          <MetricCard emoji="🤖" label="Mensagens por IA" value={loading ? '…' : fmt(data?.ai_messages ?? 0)} sub={`${fmt(data?.ai_tokens ?? 0)} tokens`} />
        </div>
      </section>

      {/* ── Section 2: Engagement ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Engajamento</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard emoji="💬" label="Novas conversas" value={loading ? '…' : fmt(data?.conversations_new ?? 0)} highlight />
          <MetricCard emoji="📥" label="Msgs recebidas" value={loading ? '…' : fmt(data?.messages_inbound ?? 0)} />
          <MetricCard emoji="📤" label="Msgs enviadas" value={loading ? '…' : fmt(data?.messages_outbound ?? 0)} />
          <MetricCard emoji="↩️" label="Reply rate" value={loading ? '…' : pct(data?.reply_rate ?? 0)} sub="respostas / mensagens" highlight={((data?.reply_rate ?? 0) >= 80)} />
        </div>
      </section>

      {/* ── Section 3: Lead Generation ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Geração de Leads</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard emoji="🎯" label="Leads gerados" value={loading ? '…' : fmt(data?.leads_generated ?? 0)} sub="sequências iniciadas" highlight />
          <MetricCard emoji="💬" label="DMs por comentário" value={loading ? '…' : fmt(data?.dms_from_comments ?? 0)} sub="Instagram comments" />
          <MetricCard emoji="✅" label="Qualificados" value={loading ? '…' : fmt(data?.qualified ?? 0)} sub="status interessado+" />
          <MetricCard emoji="📅" label="Agendamentos" value={loading ? '…' : fmt(data?.appointments ?? 0)} />
        </div>
      </section>

      {/* ── Section 4: Revenue Funnel ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Funil de Receita</h2>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <FunnelBar label="Leads gerados"      value={data?.leads_generated ?? 0}   max={funnelMax} color="bg-indigo-400" />
              <FunnelBar label="Qualificados"        value={data?.qualified ?? 0}          max={funnelMax} color="bg-violet-400" />
              <FunnelBar label="Agendamentos"        value={data?.appointments ?? 0}       max={funnelMax} color="bg-blue-400" />
              <FunnelBar label="Checkouts iniciados" value={data?.checkouts_started ?? 0}  max={funnelMax} color="bg-amber-400" />
              <FunnelBar label="Conversões (pago)"   value={data?.conversions ?? 0}        max={funnelMax} color="bg-green-500" />
              <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>Taxa de conversão</span>
                <span className="font-bold text-green-700">{pct(data?.conversion_rate ?? 0)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 5: Activation timeline ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Últimos 7 dias</h2>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-indigo-400" /> Conversas</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-blue-200" /> Mensagens</span>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          {loading || !data ? (
            <div className="h-20 flex items-end gap-2">
              {[...Array(7)].map((_, i) => <div key={i} className="flex-1 bg-gray-100 rounded-t animate-pulse" style={{ height: `${20 + i * 8}px` }} />)}
            </div>
          ) : (
            <DayChart data={data.activation.day_by_day} />
          )}
          {data && !loading && (
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              {data.activation.in_window
                ? `Dia ${data.activation.tenant_age_days} de uso — janela de ativação ativa`
                : `${data.activation.tenant_age_days} dias de uso total`}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
