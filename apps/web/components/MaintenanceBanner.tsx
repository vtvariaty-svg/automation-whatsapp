'use client';

import { usePathname } from 'next/navigation';
import { useModuleContext } from '@/hooks/useModuleContext';
import { getModuleByHref } from '@/lib/config/modules';

/**
 * Exibe um banner amarelo de manutenção quando o módulo da página atual
 * foi desabilitado globalmente pelo superadmin.
 */
export default function MaintenanceBanner() {
  const pathname = usePathname();
  const { loading, flags } = useModuleContext();

  if (loading) return null;

  const module = getModuleByHref(pathname);
  if (!module) return null;

  const flag = flags[module.id];
  if (!flag || flag.enabled !== false) return null;

  const note = flag.maintenanceNote || 'Este módulo está temporariamente indisponível para manutenção.';

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-sm z-20">
      <span className="text-amber-500 text-base shrink-0">🔧</span>
      <p className="text-amber-800 font-medium leading-tight">
        <span className="font-bold">{module.label}</span> em manutenção —{' '}
        <span className="font-normal">{note}</span>
      </p>
    </div>
  );
}
