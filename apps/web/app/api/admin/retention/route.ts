/**
 * GET /api/admin/retention
 * Superadmin only — returns health scores for all tenants ordered by score asc.
 * Query: period=7days|14days|30days, riskLevel=all|healthy|at_risk|churning
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { subDays, startOfDay } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  channel: number;
  automations: number;
  conversations: number;
  inboundMessages: number;
  aiMessages: number;
  leads: number;
  appointments: number;
}

// ─── Score computation ────────────────────────────────────────────────────────

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

// ─── GET /api/admin/retention ─────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period') ?? '30days';
  const riskLevelParam = searchParams.get('riskLevel') ?? 'all';

  // Parse period
  const periodDays =
    periodParam === '7days' ? 7 : periodParam === '14days' ? 14 : 30;
  const since = startOfDay(subDays(new Date(), periodDays));

  // Fetch all tenants (non-demo) with their subscriptions
  const tenants = await prisma.tenant.findMany({
    where: { isDemo: false },
    select: {
      id: true,
      name: true,
      whatsappToken: true,
      instagramToken: true,
      facebookToken: true,
      subscription: { select: { plan: true } },
    },
    take: 100,
  });

  // Build scores in parallel for all tenants
  const results = await Promise.all(
    tenants.map(async (tenant) => {
      const tenantId = tenant.id;

      const [
        automationsActive,
        conversations,
        inboundMessages,
        aiMessages,
        leads,
        appointments,
        salesEvents,
        lastConversation,
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
        prisma.conversation.findFirst({
          where: { tenantId },
          orderBy: { lastMessageAt: 'desc' },
          select: { lastMessageAt: true },
        }),
      ]);

      const hasChannel = Boolean(
        tenant.whatsappToken || tenant.instagramToken || tenant.facebookToken,
      );

      // Score calculation
      const breakdown: ScoreBreakdown = {
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

      return {
        tenantId,
        tenantName: tenant.name,
        plan: tenant.subscription?.plan ?? 'free',
        score,
        riskLevel,
        expansionSignal,
        breakdown,
        lastActivity: lastConversation?.lastMessageAt?.toISOString() ?? null,
      };
    }),
  );

  // Filter by riskLevel if specified
  const filtered =
    riskLevelParam === 'all'
      ? results
      : results.filter((r) => r.riskLevel === riskLevelParam);

  // Sort by score ascending (most at-risk first)
  filtered.sort((a, b) => a.score - b.score);

  return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('[Retention] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
