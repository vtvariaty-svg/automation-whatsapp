/**
 * GET /api/admin/export/:tenantId
 * Superadmin only — exports all tenant data as a downloadable JSON file.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;

  const [
    tenant,
    conversations,
    messages,
    automationRules,
    appointments,
    orders,
    auditLogs,
  ] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.message.findMany({
      where: { conversation: { tenantId } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.automationRule.findMany({ where: { tenantId } }),
    prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const exportData = {
    tenant,
    conversations,
    messages,
    automationRules,
    appointments,
    orders,
    auditLogs,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(exportData, null, 2);

  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tenant-${tenantId}-export.json"`,
    },
  });
}
