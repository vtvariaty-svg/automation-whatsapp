"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useModuleContext, resolvePinnedIds } from "@/hooks/useModuleContext";
import {
  MODULE_CATALOG,
  SIDEBAR_SECTIONS,
  getModuleById,
  type AppModule,
} from "@/lib/config/modules";
import { planAtLeast, PLANS } from "@/lib/config/plans";
import type { FeatureKey } from "@/lib/config/plans";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isModuleLocked(m: AppModule, ent: ReturnType<typeof useEntitlements>): boolean {
  if (ent.loading) return false;
  // Exact-plan gate: vertical modules that must not bleed via planAtLeast ordering
  if (m.allowedPlans) return !m.allowedPlans.includes(ent.plan ?? 'free');
  if (m.requiredFeature) return !ent.features[m.requiredFeature as FeatureKey];
  if (m.minPlan)         return !planAtLeast(ent.plan, m.minPlan);
  return false;
}


// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isSuperAdmin } = useAuth();
  const ent = useEntitlements();
  const { flags, pinnedModules: savedPins, businessType } = useModuleContext();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    const onEsc    = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    const onToggle = () => setIsOpen(p => !p);
    window.addEventListener("keydown", onEsc);
    window.addEventListener("toggle-sidebar", onToggle);
    return () => {
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("toggle-sidebar", onToggle);
    };
  }, []);

  // Superadmin vê tudo (sem filtro de plano)
  const effectivePlan = isSuperAdmin ? 'business' : (ent.plan ?? 'free');
  const pinnedIds = resolvePinnedIds(savedPins, effectivePlan, businessType);

  // Resolve módulos visíveis com estado: locked / inMaintenance / hidden
  const resolved = pinnedIds
    .map(id => getModuleById(id))
    .filter((m): m is AppModule => !!m)
    .filter(m => isSuperAdmin || !flags[m.id]?.hidden)
    .map(m => {
      const locked = isSuperAdmin ? false : isModuleLocked(m, ent);
      const flagState = flags[m.id];
      const inMaintenance = !!flagState && !flagState.enabled;
      return { ...m, locked, inMaintenance, maintenanceNote: flagState?.maintenanceNote ?? null };
    })
    .filter(m => !(m.locked && m.hideWhenLocked));

  // Grupos por seção
  const groups: { label: string | null; items: typeof resolved }[] = [];
  for (const sec of SIDEBAR_SECTIONS) {
    const items = resolved.filter(m => sec.moduleIds.includes(m.id));
    if (items.length > 0) groups.push({ label: sec.label, items });
  }
  // Módulos sem seção conhecida (fallback)
  const knownIds = new Set(SIDEBAR_SECTIONS.flatMap(s => s.moduleIds));
  const extras = resolved.filter(m => !knownIds.has(m.id));
  if (extras.length > 0) groups.push({ label: null, items: extras });

  const navContent = (
    <>
      {/* Logo */}
      <div className="h-20 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <img src="/logo.webp" alt="Variaty Secretary" className="h-16 w-auto" />
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto lg:hidden text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
          aria-label="Fechar menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {groups.map(({ label, items }, gi) => (
          <div key={gi}>
            {label && (
              <div className="pt-5 pb-2 px-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">{label}</p>
              </div>
            )}
            {items.map(m => {
              const isActive = pathname === m.href || (m.href !== '/dashboard' && pathname.startsWith(m.href + '/'));
              const lockLabel = m.locked && m.minPlan ? (PLANS[m.minPlan]?.name ?? m.minPlan) : '';

              // Em manutenção
              if (m.inMaintenance) {
                return (
                  <Link
                    key={m.id}
                    href="/dashboard/apps"
                    title={m.maintenanceNote ?? 'Em manutenção'}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400/70 hover:text-amber-300 hover:bg-white/[0.03] transition-all"
                  >
                    <span className="text-base opacity-60">{m.icon}</span>
                    <span>{m.label}</span>
                    <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">🔧</span>
                  </Link>
                );
              }

              // Bloqueado por plano (só chega aqui se hideWhenLocked=false)
              if (m.locked) {
                return (
                  <Link
                    key={m.id}
                    href="/dashboard/billing"
                    title={`Disponível a partir do plano ${lockLabel}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 opacity-50 hover:opacity-70 hover:bg-white/[0.03] transition-all"
                  >
                    <span className="text-base">{m.icon}</span>
                    <span>{m.label}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span>🔒</span>
                      {lockLabel && <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{lockLabel}</span>}
                    </span>
                  </Link>
                );
              }

              // Normal
              return (
                <Link
                  key={m.id}
                  href={m.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/10 text-white border border-indigo-500/20 shadow-sm shadow-indigo-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span className={`text-base ${isActive ? "scale-110" : ""} transition-transform`}>{m.icon}</span>
                  <span>{m.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Todos os aplicativos — sempre visível */}
        <div className="pt-4 pb-1 px-3">
          <div className="border-t border-white/[0.06]" />
        </div>
        <Link
          href="/dashboard/apps"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === '/dashboard/apps'
              ? "bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/10 text-white border border-indigo-500/20"
              : "text-gray-500 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <span className="text-base">🗂️</span>
          <span>Todos os aplicativos</span>
        </Link>
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-white/[0.06] flex flex-col gap-3">
        {isSuperAdmin ? (
          <div className="bg-gradient-to-r from-rose-500/20 to-orange-500/10 rounded-xl p-4 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">⚡ Superadmin</span>
            </div>
            <p className="text-white font-bold text-sm">Acesso total</p>
            <div className="flex flex-col gap-1 mt-3 mb-2">
              <Link href="/superadmin" className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-500/20 mb-2">
                <span className="text-sm">🛡️</span> Painel Superadmin →
              </Link>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <Link href="/dashboard/admin/diagnostics"    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">🔍 Diagnóstico →</Link>
              <Link href="/dashboard/admin/retention"      className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">📊 Retenção →</Link>
              <Link href="/dashboard/admin/feedback"       className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">💬 Feedback →</Link>
              <Link href="/dashboard/demo"                 className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">🎭 Demo →</Link>
              <Link href="/superadmin/feature-flags"       className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">🔧 Feature Flags →</Link>
              <Link href="/dashboard/admin/churn"          className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">🚨 Churn →</Link>
              <Link href="/dashboard/admin/ops"            className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors">🛡️ Ops →</Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/10">
            <p className="text-xs text-indigo-300 font-semibold mb-1">Plano Atual</p>
            <p className="text-white font-bold text-sm">{PLANS[ent.plan ?? 'free']?.name ?? 'Free'}</p>
            <Link href="/dashboard/billing" className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors">
              Fazer upgrade →
            </Link>
          </div>
        )}
        <div className="text-[10px] text-gray-500 leading-tight px-1">
          <p className="font-semibold text-gray-400">Contamei Tecnologia e Sistemas Digitais LTDA</p>
          <p>CNPJ: 64.790.325/0001-06</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[260px] bg-[#0c1120] flex-col h-full shrink-0 border-r border-white/[0.06]">
        {navContent}
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0c1120] flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {navContent}
      </aside>

      <button id="sidebar-toggle" onClick={() => setIsOpen(true)} className="hidden" aria-label="Abrir menu" />
    </>
  );
}
