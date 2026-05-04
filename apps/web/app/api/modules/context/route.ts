/**
 * GET /api/modules/context
 * Retorna feature flags globais + módulos pinados do tenant em uma chamada.
 * Usado pelo sidebar e pela página "Todos os aplicativos".
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [flags, tenant] = await Promise.all([
    prisma.featureFlag.findMany(),
    prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { pinnedModules: true, businessType: true },
    }),
  ]);

  // Mapa: moduleId → { enabled, hidden, maintenanceNote } (scope=module)
  const flagMap: Record<string, { enabled: boolean; hidden: boolean; maintenanceNote: string | null }> = {};
  // Mapa: parentModuleId → itemId → { enabled, hidden, maintenanceNote } (scope=function)
  const itemFlagMap: Record<string, Record<string, { enabled: boolean; hidden: boolean; maintenanceNote: string | null }>> = {};

  for (const f of flags) {
    if (f.scope === 'function' && f.parentModuleId) {
      if (!itemFlagMap[f.parentModuleId]) itemFlagMap[f.parentModuleId] = {};
      itemFlagMap[f.parentModuleId][f.moduleId] = {
        enabled: f.enabled,
        hidden: f.hidden,
        maintenanceNote: f.maintenanceNote ?? null,
      };
    } else {
      flagMap[f.moduleId] = { enabled: f.enabled, hidden: f.hidden, maintenanceNote: f.maintenanceNote ?? null };
    }
  }

  return NextResponse.json({
    flags: flagMap,
    itemFlags: itemFlagMap,
    pinnedModules: tenant?.pinnedModules ?? [],
    businessType: tenant?.businessType ?? null,
  });
}
