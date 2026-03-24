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
      select: { pinnedModules: true },
    }),
  ]);

  // Mapa: moduleId → { enabled, maintenanceNote }
  const flagMap: Record<string, { enabled: boolean; maintenanceNote: string | null }> = {};
  for (const f of flags) {
    flagMap[f.moduleId] = { enabled: f.enabled, maintenanceNote: f.maintenanceNote ?? null };
  }

  return NextResponse.json({
    flags: flagMap,
    pinnedModules: tenant?.pinnedModules ?? [],
  });
}
