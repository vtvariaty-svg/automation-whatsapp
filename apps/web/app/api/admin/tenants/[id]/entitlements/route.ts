/**
 * PATCH /api/admin/tenants/:id/entitlements
 * Superadmin-only: set per-tenant entitlements override.
 * Body: partial PlanEntitlements — only fields present are overridden.
 * Pass null to clear the override and restore plan defaults.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await requireAuth(request);
  if (!payload || !isSuperAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: targetTenantId } = await params;
  const body = await request.json(); // null clears override, object patches

  await prisma.subscription.update({
    where: { tenantId: targetTenantId },
    data: { entitlementsOverride: body ?? undefined },
  });

  logSuperAdminAction(payload.userId, 'set_entitlements_override', targetTenantId, { body });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await requireAuth(request);
  if (!payload || !isSuperAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: targetTenantId } = await params;

  await prisma.subscription.update({
    where: { tenantId: targetTenantId },
    data: { entitlementsOverride: undefined },
  });

  logSuperAdminAction(payload.userId, 'clear_entitlements_override', targetTenantId);

  return NextResponse.json({ ok: true });
}
