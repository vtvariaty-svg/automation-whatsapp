/**
 * GET  /api/superadmin/feature-flags  — lista todos os flags
 * PUT  /api/superadmin/feature-flags  — upsert um flag
 *   Body: { moduleId: string, enabled: boolean, maintenanceNote?: string }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { MODULE_CATALOG } from '@/lib/config/modules';

async function guardSuperadmin(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return null;
  if (auth.role !== 'superadmin') return null;
  return auth;
}

export async function GET(request: Request) {
  const auth = await guardSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const flags = await prisma.featureFlag.findMany();

  // Enriquecer com metadados do catálogo
  const flagMap: Record<string, { enabled: boolean; maintenanceNote: string | null; updatedAt: Date; updatedBy: string | null }> = {};
  for (const f of flags) {
    flagMap[f.moduleId] = {
      enabled: f.enabled,
      maintenanceNote: f.maintenanceNote,
      updatedAt: f.updatedAt,
      updatedBy: f.updatedBy,
    };
  }

  // Retorna todos os módulos com seu estado atual (default: enabled=true)
  const result = MODULE_CATALOG.map(m => ({
    moduleId: m.id,
    label: m.label,
    icon: m.icon,
    category: m.category,
    enabled: flagMap[m.id]?.enabled ?? true,
    maintenanceNote: flagMap[m.id]?.maintenanceNote ?? null,
    updatedAt: flagMap[m.id]?.updatedAt ?? null,
    updatedBy: flagMap[m.id]?.updatedBy ?? null,
  }));

  return NextResponse.json({ flags: result });
}

export async function PUT(request: Request) {
  const auth = await guardSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  let body: { moduleId?: string; enabled?: boolean; maintenanceNote?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { moduleId, enabled, maintenanceNote } = body;

  if (!moduleId || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'moduleId e enabled são obrigatórios' }, { status: 400 });
  }

  // Validar que o moduleId existe no catálogo
  if (!MODULE_CATALOG.find(m => m.id === moduleId)) {
    return NextResponse.json({ error: `Módulo "${moduleId}" não encontrado no catálogo` }, { status: 404 });
  }

  const flag = await prisma.featureFlag.upsert({
    where: { moduleId },
    create: {
      moduleId,
      enabled,
      maintenanceNote: maintenanceNote ?? null,
      updatedBy: auth.userId,
    },
    update: {
      enabled,
      maintenanceNote: maintenanceNote ?? null,
      updatedBy: auth.userId,
    },
  });

  return NextResponse.json({ ok: true, flag });
}
