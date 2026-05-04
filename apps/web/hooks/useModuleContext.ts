'use client';

import { useState, useEffect } from 'react';
import { getDefaultPinnedIdsForBusinessType } from '@/lib/config/modules';

export interface ModuleFlag {
  enabled: boolean;
  hidden: boolean;
  maintenanceNote: string | null;
}

export interface ItemFlag {
  enabled: boolean;
  hidden: boolean;
  maintenanceNote: string | null;
}

export interface ModuleContextState {
  loading: boolean;
  flags: Record<string, ModuleFlag>;
  /** parentModuleId → itemId → flag (ex: channels → whatsapp → flag) */
  itemFlags: Record<string, Record<string, ItemFlag>>;
  /** IDs explicitamente salvos pelo tenant. Vazio = usar defaults por plano. */
  pinnedModules: string[];
  /** businessType do tenant para personalização de sidebar e recomendações. */
  businessType: string | null;
}

const DEFAULT_STATE: ModuleContextState = {
  loading: true,
  flags: {},
  itemFlags: {},
  pinnedModules: [],
  businessType: null,
};

let _cache: ModuleContextState | null = null;
let _promise: Promise<void> | null = null;

/** Hook que retorna feature flags globais + pins do tenant. Cacheia por sessão. */
export function useModuleContext(): ModuleContextState {
  const [state, setState] = useState<ModuleContextState>(_cache ?? DEFAULT_STATE);

  useEffect(() => {
    if (_cache) {
      setState(_cache);
      return;
    }
    if (!_promise) {
      const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
      _promise = fetch('/api/modules/context', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const next: ModuleContextState = {
            loading: false,
            flags: data?.flags ?? {},
            itemFlags: data?.itemFlags ?? {},
            pinnedModules: data?.pinnedModules ?? [],
            businessType: data?.businessType ?? null,
          };
          _cache = next;
          setState(next);
        })
        .catch(() => {
          const next: ModuleContextState = { ...DEFAULT_STATE, loading: false, itemFlags: {} };
          _cache = next;
          setState(next);
        });
    } else {
      _promise.then(() => { if (_cache) setState(_cache); });
    }
  }, []);

  return state;
}

/** Invalida o cache (chamar após salvar pins ou após logout). */
export function invalidateModuleContext() {
  _cache = null;
  _promise = null;
}

/** Resolve os IDs pinados: pins do tenant SE preenchido, senão defaults por plano + businessType. */
export function resolvePinnedIds(
  pinnedModules: string[],
  plan: string | null,
  businessType?: string | null,
): string[] {
  if (pinnedModules.length > 0) return pinnedModules;
  return getDefaultPinnedIdsForBusinessType(plan ?? 'free', businessType);
}
