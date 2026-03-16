/**
 * GET /api/admin/diagnostics/:tenantId
 * Superadmin only — comprehensive tenant diagnostic snapshot.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getCircuitSnapshot } from '@/lib/resilience/circuitBreaker';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    tenant,
    subscription,
    automationsAll,
    recentErrors,
    recentAudit,
    notes,
    conversations7d,
    messages7d,
    aiTokens7d,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        isDemo: true,
        enabledChannels: true,
        channelKillSwitch: true,
        createdAt: true,
        whatsappToken: true,
        instagramToken: true,
        facebookToken: true,
        whatsappConnection: { select: { status: true } },
        instagramConnection: { select: { status: true } },
        facebookConnection: { select: { status: true } },
      },
    }),
    prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true, status: true, trialEnd: true },
    }),
    prisma.automationRule.findMany({
      where: { tenantId },
      select: { active: true },
    }),
    prisma.deadLetterEvent.findMany({
      where: { tenantId, status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.supportNote.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.conversation.count({
      where: { tenantId, createdAt: { gte: since7d } },
    }),
    prisma.message.count({
      where: {
        conversation: { tenantId },
        createdAt: { gte: since7d },
      },
    }),
    prisma.aiUsage.aggregate({
      where: { tenantId, createdAt: { gte: since7d } },
      _sum: { totalTokens: true },
    }),
  ]);

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const allCircuits = getCircuitSnapshot();
  const circuitBreaker = Object.fromEntries(
    Object.entries(allCircuits).filter(([k]) => k.startsWith(tenantId)),
  );

  const enabledSet = new Set((tenant.enabledChannels ?? '').split(',').filter(Boolean));

  const channels = {
    whatsapp: {
      connected: tenant.whatsappConnection?.status === 'connected',
      hasToken: Boolean(tenant.whatsappToken),
      enabled: enabledSet.has('whatsapp'),
    },
    instagram: {
      connected: tenant.instagramConnection?.status === 'connected',
      hasToken: Boolean(tenant.instagramToken),
      enabled: enabledSet.has('instagram'),
    },
    facebook: {
      connected: tenant.facebookConnection?.status === 'connected',
      hasToken: Boolean(tenant.facebookToken),
      enabled: enabledSet.has('facebook'),
    },
  };

  const automations = {
    active: automationsAll.filter((r) => r.active).length,
    total: automationsAll.length,
  };

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      isDemo: tenant.isDemo,
      enabledChannels: tenant.enabledChannels,
      channelKillSwitch: tenant.channelKillSwitch,
      createdAt: tenant.createdAt,
    },
    channels,
    subscription: subscription ?? null,
    automations,
    recentErrors,
    recentAudit,
    circuitBreaker,
    notes,
    stats: {
      conversations7d,
      messages7d,
      aiTokens7d: aiTokens7d._sum.totalTokens ?? 0,
    },
  });
}
