/**
 * PUT /api/modules/pins
 * Salva a lista de módulos pinados do tenant.
 * Body: { pinnedModules: string[] }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { MODULE_CATALOG } from '@/lib/config/modules';

const VALID_IDS = new Set(MODULE_CATALOG.map(m => m.id));

export async function PUT(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { pinnedModules?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const raw = body.pinnedModules;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: 'pinnedModules deve ser um array' }, { status: 400 });
  }

  // Filtra IDs inválidos
  const pinnedModules = (raw as unknown[])
    .filter((id): id is string => typeof id === 'string' && VALID_IDS.has(id));

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { pinnedModules },
  });

  return NextResponse.json({ ok: true, pinnedModules });
}
