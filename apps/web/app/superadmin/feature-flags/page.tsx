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
  maintenanceNote: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'todos' | 'disabled'>('todos');

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const token = document.cookie.match(/auth_token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/superadmin/feature-flags', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags);
        const notes: Record<string, string> = {};
        for (const f of data.flags) {
          notes[f.moduleId] = f.maintenanceNote ?? '';
        }
        setEditNote(notes);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggle(moduleId: string, enabled: boolean) {
    setSaving(moduleId);
    try {
      const token = document.cookie.match(/auth_token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/superadmin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          moduleId,
          enabled,
          maintenanceNote: editNote[moduleId] || null,
        }),
      });
      if (res.ok) {
        setFlags(prev => prev.map(f => f.moduleId === moduleId ? { ...f, enabled } : f));
      }
    } finally {
      setSaving(null);
    }
  }

  async function saveNote(moduleId: string) {
    const current = flags.find(f => f.moduleId === moduleId);
    if (!current) return;
    setSaving(moduleId);
    try {
      const token = document.cookie.match(/auth_token=([^;]+)/)?.[1] ?? '';
      await fetch('/api/superadmin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          moduleId,
          enabled: current.enabled,
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

  const displayed = filter === 'disabled' ? flags.filter(f => !f.enabled) : flags;
  const disabledCount = flags.filter(f => !f.enabled).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/superadmin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2 inline-flex items-center gap-1">
              ← Painel Superadmin
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">🔧 Feature Flags</h1>
            <p className="text-sm text-gray-400 mt-1">
              Habilite ou desabilite módulos globalmente para todos os tenants.
            </p>
          </div>
          <div className="text-right">
            {disabledCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2">
                <span className="text-amber-400 font-bold text-sm">{disabledCount}</span>
                <span className="text-amber-300 text-xs">módulo{disabledCount > 1 ? 's' : ''} desabilitado{disabledCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-300">
          <strong className="text-rose-400">⚠️ Atenção:</strong> Desabilitar um módulo afeta <strong>todos os tenants imediatamente</strong>.
          Um banner de manutenção será exibido na dashboard dos clientes afetados.
          Use a nota de manutenção para dar contexto ao usuário.
        </div>

        {/* Filtro */}
        <div className="flex gap-3">
          {(['todos', 'disabled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'todos' ? `Todos (${flags.length})` : `Desabilitados (${disabledCount})`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Carregando...</div>
        ) : (
          <div className="space-y-3">
            {displayed.map(flag => (
              <div
                key={flag.moduleId}
                className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                  flag.enabled ? 'border-white/[0.06]' : 'border-amber-500/30 bg-amber-500/5'
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

                  {/* Toggle */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${flag.enabled ? 'text-green-400' : 'text-amber-400'}`}>
                      {flag.enabled ? '✅ Ativo' : '🔧 Desabilitado'}
                    </span>
                    <button
                      disabled={saving === flag.moduleId}
                      onClick={() => toggle(flag.moduleId, !flag.enabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                        flag.enabled ? 'bg-green-500' : 'bg-gray-600'
                      } ${saving === flag.moduleId ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
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
                    onClick={() => saveNote(flag.moduleId)}
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
  );
}
