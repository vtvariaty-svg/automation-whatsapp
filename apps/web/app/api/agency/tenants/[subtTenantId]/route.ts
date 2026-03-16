import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { canManageSubtenant } from '@/lib/agency';
import { subDays, startOfDay } from 'date-fns';

// GET /api/agency/tenants/:subtTenantId — get sub-tenant details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ subtTenantId: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subtTenantId } = await params;

  try {
    const allowed = await canManageSubtenant(auth.tenantId, auth.userId, subtTenantId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const since7d = startOfDay(subDays(new Date(), 7));

    const [tenant, conversationCount, messageCount, automationsActive] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: subtTenantId },
        include: {
          subscription: { select: { plan: true, status: true, trialEnd: true } },
        },
      }),
      prisma.conversation.count({
        where: { tenantId: subtTenantId, createdAt: { gte: since7d } },
      }),
      prisma.message.count({
        where: {
          conversation: { tenantId: subtTenantId },
          createdAt: { gte: since7d },
        },
      }),
      prisma.automationRule.count({
        where: { tenantId: subtTenantId, active: true },
      }),
    ]);

    if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...tenant,
      stats: {
        conversations7d: conversationCount,
        messages7d: messageCount,
        automationsActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/agency/tenants/:subtTenantId — update sub-tenant
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subtTenantId: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subtTenantId } = await params;

  try {
    const allowed = await canManageSubtenant(auth.tenantId, auth.userId, subtTenantId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, agencyBranding } = body;

    const updated = await prisma.tenant.update({
      where: { id: subtTenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(agencyBranding !== undefined && { agencyBranding }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
