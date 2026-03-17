"use client";

import { useState, useEffect } from "react";

interface Analytics {
  period: number;
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  confirmationRate: number | null;
  attendanceRate: number | null;
  cancellationRate: number | null;
  avgLeadTimeDays: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-blue-400",
  confirmado: "bg-green-400",
  concluido: "bg-gray-400",
  cancelado: "bg-red-400",
  no_show: "bg-orange-400",
};

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  facebook: "📘",
  manual: "✏️",
};

function StatCard({
  label, value, sub, color = "text-gray-900",
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface Props {
  days?: number;
}

export function SchedulingStatsBar({ days = 30 }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(days);

  useEffect(() => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    setLoading(true);
    fetch(`/api/appointments/analytics?days=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const totalStatuses = Object.values(data.byStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">Métricas da Agenda</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${period === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total agendamentos" value={data.total} sub={`últimos ${period} dias`} />
        <StatCard
          label="Taxa de confirmação"
          value={data.confirmationRate !== null ? `${data.confirmationRate}%` : '—'}
          sub="confirmados + concluídos"
          color={data.confirmationRate !== null && data.confirmationRate >= 60 ? "text-green-600" : "text-gray-900"}
        />
        <StatCard
          label="Taxa de comparecimento"
          value={data.attendanceRate !== null ? `${data.attendanceRate}%` : '—'}
          sub="concluídos / (conc. + no-show)"
          color={data.attendanceRate !== null && data.attendanceRate >= 70 ? "text-green-600" : data.attendanceRate !== null && data.attendanceRate < 50 ? "text-red-500" : "text-gray-900"}
        />
        <StatCard
          label="Antecedência média"
          value={data.avgLeadTimeDays !== null ? `${data.avgLeadTimeDays}d` : '—'}
          sub="entre booking e horário"
        />
      </div>

      {/* Status breakdown bar */}
      {totalStatuses > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-5 py-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Distribuição por status</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {Object.entries(data.byStatus)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div
                  key={status}
                  className={`${STATUS_COLORS[status] ?? 'bg-gray-300'} transition-all`}
                  style={{ width: `${(count / totalStatuses) * 100}%` }}
                  title={`${STATUS_LABELS[status] ?? status}: ${count}`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(data.byStatus)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <span key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-300'}`} />
                  {STATUS_LABELS[status] ?? status} <span className="font-semibold text-gray-900">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Origin breakdown */}
      {Object.keys(data.bySource).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-3">Origem dos agendamentos</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.bySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm">{SOURCE_ICONS[source] ?? '📌'}</span>
                  <span className="text-xs font-medium text-gray-700 capitalize">{source}</span>
                  <span className="text-xs font-bold text-[#4f46e5]">{count}</span>
                  {data.total > 0 && (
                    <span className="text-xs text-gray-400">({Math.round((count / data.total) * 100)}%)</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
