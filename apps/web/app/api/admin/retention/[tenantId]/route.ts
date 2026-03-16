/**
 * POST /api/admin/retention/:tenantId
 * Superadmin only — recomputes and upserts TenantHealthScore for the given tenant.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { subDays, startOfDay } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRiskLevel(score: number): string {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'at_risk';
  return 'churning';
}

function computeExpansionSignal(opts: {
  automationsActive: number;
  conversations: number;
  messages: number;
}): boolean {
  return (
    opts.automationsActive > 5 ||
    opts.conversations > 50 ||
    opts.messages > 200
  );
}

// ─── POST /api/admin/retention/:tenantId ──────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, whatsappToken: true, instagramToken: true, facebookToken: true },
  });
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  // Use last 30 days for recomputation
  const since = startOfDay(subDays(new Date(), 30));

  const [
    automationsActive,
    conversations,
    inboundMessages,
    aiMessages,
    leads,
    appointments,
    salesEvents,
  ] = await Promise.all([
    prisma.automationRule.count({ where: { tenantId, active: true } }),
    prisma.conversation.count({ where: { tenantId, createdAt: { gte: since } } }),
    prisma.message.count({
      where: {
        conversation: { tenantId },
        direction: 'inbound',
        createdAt: { gte: since },
      },
    }),
    prisma.message.count({
      where: {
        conversation: { tenantId },
        aiGenerated: true,
        createdAt: { gte: since },
      },
    }),
    prisma.conversionLead.count({ where: { tenantId, createdAt: { gte: since } } }),
    prisma.appointment.count({ where: { tenantId, createdAt: { gte: since } } }),
    prisma.salesEvent.count({ where: { tenantId, createdAt: { gte: since } } }),
  ]);

  const hasChannel = Boolean(
    tenant.whatsappToken || tenant.instagramToken || tenant.facebookToken,
  );

  const breakdown = {
    channel: hasChannel ? 20 : 0,
    automations: automationsActive > 0 ? 20 : 0,
    conversations: conversations > 0 ? 15 : 0,
    inboundMessages: inboundMessages > 5 ? 15 : 0,
    aiMessages: aiMessages > 0 ? 10 : 0,
    leads: leads > 0 ? 10 : 0,
    appointments: appointments > 0 || salesEvents > 0 ? 10 : 0,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const riskLevel = computeRiskLevel(score);
  const expansionSignal = computeExpansionSignal({
    automationsActive,
    conversations,
    messages: inboundMessages + aiMessages,
  });

  await prisma.tenantHealthScore.upsert({
    where: { tenantId },
    update: {
      score,
      riskLevel,
      expansionSignal,
      breakdown,
      computedAt: new Date(),
    },
    create: {
      tenantId,
      score,
      riskLevel,
      expansionSignal,
      breakdown,
      computedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, score, riskLevel });
}
