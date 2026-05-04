'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORY_LABELS, type ModuleCategory } from '@/lib/config/modules';

interface FlagRow {
  moduleId: string;
  label: string;
  icon: string;
  category: ModuleCategory;
  enabled: boolean;
  hidden: boolean;
  maintenanceNote: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface ChannelItemRow {
  moduleId: string;
  label: string;
  parentModuleId: string;
  enabled: boolean;
  hidden: boolean;
  maintenanceNote: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [channelItems, setChannelItems] = useState<ChannelItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'todos' | 'disabled' | 'hidden'>('todos');

  useEffect(() => {
    loadFlags();
  }, []);

  const authToken = () => document.cookie.match(/auth_token=([^;]+)/)?.[1] ?? '';

  async function loadFlags() {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/feature-flags', {
        headers: { Authorization: `Bearer ${authToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags);
        setChannelItems(data.channelItems ?? []);
        const notes: Record<string, string> = {};
        for (const f of data.flags) notes[f.moduleId] = f.maintenanceNote ?? '';
        for (const f of (data.channelItems ?? [])) notes[`ch_${f.moduleId}`] = f.maintenanceNote ?? '';
        setEditNote(notes);
      }
    } finally {
      setLoading(false);
    }
  }

  async function upsertFlag(
    moduleId: string,
    enabled: boolean,
    hidden: boolean,
    noteKey: string,
    scope?: string,
    parentModuleId?: string,
  ) {
    setSaving(moduleId);
    try {
      const res = await fetch('/api/superadmin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({
          moduleId,
          enabled,
          hidden,
          maintenanceNote: editNote[noteKey] || null,
          scope,
          parentModuleId,
        }),
      });
      if (res.ok) {
        if (scope === 'function') {
          setChannelItems(prev => prev.map(f =>
            f.moduleId === moduleId ? { ...f, enabled, hidden } : f
          ));
        } else {
          setFlags(prev => prev.map(f =>
            f.moduleId === moduleId ? { ...f, enabled, hidden } : f
          ));
        }
      }
    } finally {
      setSaving(null);
    }
  }

  async function saveModuleNote(moduleId: string) {
    const current = flags.find(f => f.moduleId === moduleId);
    if (!current) return;
    setSaving(moduleId);
    try {
      await fetch('/api/superadmin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({
          moduleId,
          enabled: current.enabled,
          hidden: current.hidden,
          maintenanceNote: editNote[moduleId] || null,
        }),
      });
      setFlags(prev =>
        prev.map(f => f.moduleId === moduleId ? { ...f, maintenanceNote: editNote[moduleId] || null } : f)
      );
    } finally {
      setSaving(null);
    }
  }

  const disabledCount = flags.filter(f => !f.enabled).length;
  const hiddenCount = flags.filter(f => f.hidden).length;

  const displayed = filter === 'disabled'
    ? flags.filter(f => !f.enabled)
    : filter === 'hidden'
    ? flags.filter(f => f.hidden)
    : flags;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/superadmin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2 inline-flex items-center gap-1">
              ← Painel Superadmin
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">🔧 Feature Flags & Visibilidade</h1>
            <p className="text-sm text-gray-400 mt-1">
              Controle visibilidade e ativação de módulos e canais para todos os tenants.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {disabledCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2">
                <span className="text-amber-400 font-bold text-sm">{disabledCount}</span>
                <span className="text-amber-300 text-xs">desabilitado{disabledCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {hiddenCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-xl px-4 py-2">
                <span className="text-purple-400 font-bold text-sm">{hiddenCount}</span>
                <span className="text-purple-300 text-xs">oculto{hiddenCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-300 space-y-1">
          <p><strong className="text-rose-400">⚠️ Atenção:</strong> Alterações afetam <strong>todos os tenants imediatamente</strong>.</p>
          <p><span className="text-amber-400 font-semibold">Desativado:</span> tenant vê o módulo com aviso de manutenção.</p>
          <p><span className="text-purple-400 font-semibold">Oculto:</span> tenant não vê o módulo/opção. Ocultar não remove dados existentes.</p>
        </div>

        {/* ── Canais — controle granular ───────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">📡 Canais — Controle por opção</h2>
          <div className="space-y-3">
            {channelItems.map(item => {
              const noteKey = `ch_${item.moduleId}`;
              return (
                <div
                  key={item.moduleId}
                  className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                    item.hidden ? 'border-purple-500/30 bg-purple-500/5' :
                    !item.enabled ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-white/[0.06]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm">{item.label}</p>
                          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                            channels / {item.moduleId}
                          </span>
                        </div>
                        {item.updatedAt && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Atualizado em {new Date(item.updatedAt).toLocaleString('pt-BR')}
                            {item.updatedBy && ` por ${item.updatedBy}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 flex-wrap">
                      {/* Ativo toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Ativo</span>
                        <button
                          disabled={saving === item.moduleId}
                          onClick={() => upsertFlag(item.moduleId, !item.enabled, item.hidden, noteKey, 'function', item.parentModuleId)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                            item.enabled ? 'bg-green-500' : 'bg-gray-600'
                          } ${saving === item.moduleId ? 'opacity-50' : ''}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Oculto toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Oculto</span>
                        <button
                          disabled={saving === item.moduleId}
                          onClick={() => upsertFlag(item.moduleId, item.enabled, !item.hidden, noteKey, 'function', item.parentModuleId)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                            item.hidden ? 'bg-purple-500' : 'bg-gray-600'
                          } ${saving === item.moduleId ? 'opacity-50' : ''}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.hidden ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <span className={`text-xs font-bold ${
                        item.hidden ? 'text-purple-400' : item.enabled ? 'text-green-400' : 'text-amber-400'
                      }`}>
                        {item.hidden ? '🫥 Oculto' : item.enabled ? '✅ Ativo' : '🔧 Desabilitado'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={editNote[noteKey] ?? ''}
                      onChange={e => setEditNote(prev => ({ ...prev, [noteKey]: e.target.value }))}
                      placeholder="Nota de manutenção (opcional)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20"
                    />
                    <button
                      disabled={saving === item.moduleId}
                      onClick={() => upsertFlag(item.moduleId, item.enabled, item.hidden, noteKey, 'function', item.parentModuleId)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Módulos ──────────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">📦 Módulos</h2>

          {/* Filtro */}
          <div className="flex gap-3 mb-4">
            {(['todos', 'disabled', 'hidden'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f === 'todos' ? `Todos (${flags.length})` :
                 f === 'disabled' ? `Desabilitados (${disabledCount})` :
                 `Ocultos (${hiddenCount})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {displayed.map(flag => (
                <div
                  key={flag.moduleId}
                  className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                    flag.hidden ? 'border-purple-500/30 bg-purple-500/5' :
                    !flag.enabled ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-white/[0.06]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{flag.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm">{flag.label}</p>
                          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                            {flag.moduleId}
                          </span>
                          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                            {CATEGORY_LABELS[flag.category]}
                          </span>
                        </div>
                        {flag.updatedAt && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Atualizado em {new Date(flag.updatedAt).toLocaleString('pt-BR')}
                            {flag.updatedBy && ` por ${flag.updatedBy}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-4 shrink-0 flex-wrap">
                      {/* Ativo toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Ativo</span>
                        <button
                          disabled={saving === flag.moduleId}
                          onClick={() => upsertFlag(flag.moduleId, !flag.enabled, flag.hidden, flag.moduleId)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                            flag.enabled ? 'bg-green-500' : 'bg-gray-600'
                          } ${saving === flag.moduleId ? 'opacity-50' : ''}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${flag.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Oculto toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Oculto</span>
                        <button
                          disabled={saving === flag.moduleId}
                          onClick={() => upsertFlag(flag.moduleId, flag.enabled, !flag.hidden, flag.moduleId)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                            flag.hidden ? 'bg-purple-500' : 'bg-gray-600'
                          } ${saving === flag.moduleId ? 'opacity-50' : ''}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${flag.hidden ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <span className={`text-xs font-bold ${
                        flag.hidden ? 'text-purple-400' : flag.enabled ? 'text-green-400' : 'text-amber-400'
                      }`}>
                        {flag.hidden ? '🫥 Oculto' : flag.enabled ? '✅ Ativo' : '🔧 Desabilitado'}
                      </span>
                    </div>
                  </div>

                  {/* Nota de manutenção */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={editNote[flag.moduleId] ?? ''}
                      onChange={e => setEditNote(prev => ({ ...prev, [flag.moduleId]: e.target.value }))}
                      placeholder="Nota de manutenção exibida aos usuários (opcional)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20"
                    />
                    <button
                      disabled={saving === flag.moduleId}
                      onClick={() => saveModuleNote(flag.moduleId)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      Salvar nota
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
