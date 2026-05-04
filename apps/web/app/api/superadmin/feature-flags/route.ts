/**
 * GET  /api/superadmin/feature-flags  — lista todos os flags (módulos + itens de canal)
 * PUT  /api/superadmin/feature-flags  — upsert um flag
 *   Body: { moduleId, enabled, hidden?, maintenanceNote?, scope?, parentModuleId? }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { MODULE_CATALOG } from '@/lib/config/modules';

const CHANNEL_ITEMS = [
  { moduleId: 'whatsapp', label: 'WhatsApp', parentModuleId: 'channels' },
  { moduleId: 'instagram', label: 'Instagram', parentModuleId: 'channels' },
  { moduleId: 'facebook', label: 'Facebook Manager', parentModuleId: 'channels' },
];

async function guardSuperadmin(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return null;
  if (auth.role !== 'superadmin') return null;
  return auth;
}

export async function GET(request: Request) {
  const auth = await guardSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const allFlags = await prisma.featureFlag.findMany();

  const moduleFlagMap: Record<string, typeof allFlags[0]> = {};
  const itemFlagMap: Record<string, typeof allFlags[0]> = {};
  for (const f of allFlags) {
    if (f.scope === 'function') itemFlagMap[f.moduleId] = f;
    else moduleFlagMap[f.moduleId] = f;
  }

  // Module-level flags
  const modules = MODULE_CATALOG.map(m => ({
    moduleId: m.id,
    label: m.label,
    icon: m.icon,
    category: m.category,
    enabled: moduleFlagMap[m.id]?.enabled ?? true,
    hidden: moduleFlagMap[m.id]?.hidden ?? false,
    maintenanceNote: moduleFlagMap[m.id]?.maintenanceNote ?? null,
    updatedAt: moduleFlagMap[m.id]?.updatedAt ?? null,
    updatedBy: moduleFlagMap[m.id]?.updatedBy ?? null,
  }));

  // Channel item flags
  const channelItems = CHANNEL_ITEMS.map(item => ({
    moduleId: item.moduleId,
    label: item.label,
    parentModuleId: item.parentModuleId,
    enabled: itemFlagMap[item.moduleId]?.enabled ?? true,
    hidden: itemFlagMap[item.moduleId]?.hidden ?? false,
    maintenanceNote: itemFlagMap[item.moduleId]?.maintenanceNote ?? null,
    updatedAt: itemFlagMap[item.moduleId]?.updatedAt ?? null,
    updatedBy: itemFlagMap[item.moduleId]?.updatedBy ?? null,
  }));

  return NextResponse.json({ flags: modules, channelItems });
}

export async function PUT(request: Request) {
  const auth = await guardSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  let body: {
    moduleId?: string;
    enabled?: boolean;
    hidden?: boolean;
    maintenanceNote?: string | null;
    scope?: string;
    parentModuleId?: string;
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { moduleId, enabled, hidden, maintenanceNote, scope, parentModuleId } = body;

  if (!moduleId || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'moduleId e enabled são obrigatórios' }, { status: 400 });
  }

  const resolvedScope = scope === 'function' ? 'function' : 'module';

  // Validate moduleId exists in catalog or channel items
  if (resolvedScope === 'module' && !MODULE_CATALOG.find(m => m.id === moduleId)) {
    return NextResponse.json({ error: `Módulo "${moduleId}" não encontrado no catálogo` }, { status: 404 });
  }
  if (resolvedScope === 'function' && !CHANNEL_ITEMS.find(i => i.moduleId === moduleId)) {
    return NextResponse.json({ error: `Item "${moduleId}" não encontrado` }, { status: 404 });
  }

  const flag = await prisma.featureFlag.upsert({
    where: { moduleId_scope: { moduleId, scope: resolvedScope } },
    create: {
      moduleId,
      scope: resolvedScope,
      parentModuleId: parentModuleId ?? null,
      enabled,
      hidden: hidden ?? false,
      maintenanceNote: maintenanceNote ?? null,
      updatedBy: auth.userId,
    },
    update: {
      enabled,
      hidden: hidden ?? false,
      maintenanceNote: maintenanceNote ?? null,
      updatedBy: auth.userId,
    },
  });

  return NextResponse.json({ ok: true, flag });
}
