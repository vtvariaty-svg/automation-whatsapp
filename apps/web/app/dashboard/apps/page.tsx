'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useModuleContext, resolvePinnedIds, invalidateModuleContext } from '@/hooks/useModuleContext';
import { useAuth } from '@/hooks/useAuth';
import {
  MODULE_CATALOG,
  CATEGORY_LABELS,
  type AppModule,
  type ModuleCategory,
} from '@/lib/config/modules';
import { planAtLeast } from '@/lib/config/plans';
import type { FeatureKey } from '@/lib/config/plans';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLocked(m: AppModule, ent: ReturnType<typeof useEntitlements>): boolean {
  if (ent.loading) return false;
  if (m.allowedPlans) return !m.allowedPlans.includes(ent.plan ?? 'free');
  if (m.requiredFeature) return !ent.features[m.requiredFeature as FeatureKey];
  if (m.minPlan) return !planAtLeast(ent.plan, m.minPlan);
  return false;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AllAppsPage() {
  const { isSuperAdmin } = useAuth();
  const ent = useEntitlements();
  const { flags, pinnedModules: savedPins, businessType, loading: ctxLoading } = useModuleContext();
  const [localPins, setLocalPins] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | 'todos'>('todos');

  // Usa pins salvos como estado local editável
  useEffect(() => {
    if (!ctxLoading && localPins === null) {
      const resolved = resolvePinnedIds(savedPins, ent.plan ?? 'free', businessType);
      setLocalPins(resolved);
    }
  }, [ctxLoading, savedPins, ent.plan, businessType, localPins]);

  const pins = localPins ?? resolvePinnedIds(savedPins, ent.plan ?? 'free', businessType);

  function togglePin(id: string) {
    setLocalPins(prev => {
      const current = prev ?? [];
      return current.includes(id) ? current.filter(p => p !== id) : [...current, id];
    });
  }

  async function savePins() {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
      await fetch('/api/modules/pins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pinnedModules: pins }),
      });
      invalidateModuleContext();
    } finally {
      setSaving(false);
    }
  }

  // Filtragem
  const filtered = MODULE_CATALOG.filter(m => {
    if (m.id === 'apps') return false; // esconde meta-módulo da listagem
    if (!isSuperAdmin && flags[m.id]?.hidden) return false; // oculto pelo admin
    if (activeCategory !== 'todos' && m.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Agrupa por categoria
  const byCategory = filtered.reduce<Partial<Record<ModuleCategory, AppModule[]>>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category]!.push(m);
    return acc;
  }, {});

  const categories = (Object.keys(CATEGORY_LABELS) as ModuleCategory[]).filter(
    c => byCategory[c]?.length
  );

  const hasChanges =
    localPins !== null &&
    JSON.stringify([...localPins].sort()) !== JSON.stringify([...resolvePinnedIds(savedPins, ent.plan ?? 'free', businessType)].sort());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todos os aplicativos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Explore, ative e personalize os módulos da sua sidebar.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={savePins}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
          >
            {saving ? '💾 Salvando...' : '💾 Salvar sidebar'}
          </button>
        )}
      </div>

      {/* Search + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar módulos..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', ...Object.keys(CATEGORY_LABELS)] as (ModuleCategory | 'todos')[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'todos' ? 'Todos' : CATEGORY_LABELS[cat as ModuleCategory]}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Na sidebar</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Oculto da sidebar</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Bloqueado pelo plano</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Em manutenção</span>
        {businessType && <span className="flex items-center gap-1.5">⭐ Recomendado para seu negócio</span>}
      </div>

      {/* Categorias */}
      {categories.map(cat => (
        <section key={cat}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            {CATEGORY_LABELS[cat]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCategory[cat]!.map(m => {
              const locked = isLocked(m, ent);
              const flagState = flags[m.id];
              const inMaintenance = !!flagState && !flagState.enabled;
              const isPinned = pins.includes(m.id);
              const isRecommended = !!(
                businessType &&
                m.recommendedFor?.includes(businessType.toLowerCase())
              );

              let statusColor = 'border-gray-200';
              let statusBadge: React.ReactNode = null;

              if (inMaintenance) {
                statusColor = 'border-amber-200 bg-amber-50/50';
                statusBadge = (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    🔧 Manutenção
                  </span>
                );
              } else if (locked) {
                statusColor = 'border-red-100 bg-red-50/30';
                statusBadge = (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    🔒 {m.minPlan ? `Plano ${m.minPlan}` : 'Bloqueado'}
                  </span>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all ${statusColor} ${
                    !locked && !inMaintenance ? 'hover:shadow-md hover:border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${(locked || inMaintenance) ? 'opacity-50' : ''}`}>
                        {m.icon}
                      </span>
                      <div>
                        <p className={`font-semibold text-sm ${(locked || inMaintenance) ? 'text-gray-400' : 'text-gray-900'}`}>
                          {m.label}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {statusBadge}
                          {isRecommended && !locked && !inMaintenance && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                              ⭐ Recomendado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Toggle de pin */}
                    {!locked && !inMaintenance && (
                      <button
                        onClick={() => togglePin(m.id)}
                        title={isPinned ? 'Remover da sidebar' : 'Adicionar à sidebar'}
                        className={`shrink-0 p-1.5 rounded-lg transition-all text-xs font-bold ${
                          isPinned
                            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                      >
                        {isPinned ? '📌 Na sidebar' : '＋ Adicionar'}
                      </button>
                    )}
                    {locked && (
                      <Link
                        href="/dashboard/billing"
                        className="shrink-0 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        Upgrade →
                      </Link>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${(locked || inMaintenance) ? 'text-gray-400' : 'text-gray-500'}`}>
                    {inMaintenance && flagState?.maintenanceNote
                      ? flagState.maintenanceNote
                      : m.description}
                  </p>

                  {!locked && !inMaintenance && (
                    <Link
                      href={m.href}
                      className="self-start text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      Abrir →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">Nenhum módulo encontrado para "{search}"</p>
        </div>
      )}
    </div>
  );
}
