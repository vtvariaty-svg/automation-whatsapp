import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const searchRun = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!searchRun) return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });

  const executions = await prisma.leadCampaignExecution.findMany({
    where: { searchRunId: id, tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  const executionIds = executions.map((e) => e.id);

  const items = await prisma.leadCampaignExecutionItem.findMany({
    where: { executionId: { in: executionIds }, tenantId: auth.tenantId }
  });

  interface AggrStats {
    totalRequested: number;
    totalEligible: number;
    totalExecutions?: number;
    totalSent: number;
    totalFailed: number;
    totalSkipped: number;
    totalDelivered: number;
    totalOpened: number;
    totalReplied: number;
    totalQualified: number;
    totalConverted: number;
    totalLost: number;
    totalUnsubscribed: number;
    totalConversionValue: number;
    rates?: { replyRate: number; qualificationRate: number; conversionRate: number; unsubscribeRate: number };
  }

  function aggr(list: typeof items): AggrStats {
    const totalSent = list.filter((i) => i.status === 'sent').length;
    return {
      totalRequested: 0,
      totalEligible: 0,
      totalSent,
      totalFailed:        list.filter((i) => i.status === 'failed').length,
      totalSkipped:       list.filter((i) => i.status === 'skipped').length,
      totalDelivered:     list.filter((i) => i.responseStatus === 'delivered'    || ['opened','replied','qualified','converted','lost'].includes(i.responseStatus ?? '')).length,
      totalOpened:        list.filter((i) => i.responseStatus === 'opened'       || ['replied','qualified','converted','lost'].includes(i.responseStatus ?? '')).length,
      totalReplied:       list.filter((i) => i.responseStatus === 'replied'      || ['qualified','converted','lost'].includes(i.responseStatus ?? '')).length,
      totalQualified:     list.filter((i) => i.responseStatus === 'qualified'    || i.responseStatus === 'converted').length,
      totalConverted:     list.filter((i) => i.responseStatus === 'converted').length,
      totalLost:          list.filter((i) => i.responseStatus === 'lost').length,
      totalUnsubscribed:  list.filter((i) => i.responseStatus === 'unsubscribed').length,
      totalConversionValue: list.reduce((acc, curr) => acc + (curr.conversionValue ?? 0), 0),
    };
  }

  const overallStats: AggrStats = aggr(items);
  overallStats.totalRequested  = executions.reduce((acc, curr) => acc + curr.requestedCount, 0);
  overallStats.totalEligible   = executions.reduce((acc, curr) => acc + curr.eligibleCount,  0);
  overallStats.totalExecutions = executions.length;

  const emailItems    = items.filter((i) => i.channel === 'email');
  const whatsappItems = items.filter((i) => i.channel === 'whatsapp');

  function calcRates(stats: AggrStats) {
    const sent = stats.totalSent || 0;
    if (sent === 0) return { replyRate: 0, qualificationRate: 0, conversionRate: 0, unsubscribeRate: 0 };
    return {
      replyRate:          stats.totalReplied      / sent,
      qualificationRate:  stats.totalQualified    / sent,
      conversionRate:     stats.totalConverted    / sent,
      unsubscribeRate:    stats.totalUnsubscribed / sent,
    };
  }

  const overall = overallStats;
  const rates   = calcRates(overall);

  const emailStats: AggrStats = {
    ...aggr(emailItems),
    totalRequested:  executions.filter((e) => e.channel === 'email').reduce((a, c) => a + c.requestedCount, 0),
    totalEligible:   executions.filter((e) => e.channel === 'email').reduce((a, c) => a + c.eligibleCount,  0),
    totalExecutions: executions.filter((e) => e.channel === 'email').length,
  };
  const whatsappStats: AggrStats = {
    ...aggr(whatsappItems),
    totalRequested:  executions.filter((e) => e.channel === 'whatsapp').reduce((a, c) => a + c.requestedCount, 0),
    totalEligible:   executions.filter((e) => e.channel === 'whatsapp').reduce((a, c) => a + c.eligibleCount,  0),
    totalExecutions: executions.filter((e) => e.channel === 'whatsapp').length,
  };

  const byChannel = {
    email:    { ...emailStats,    rates: calcRates(emailStats) },
    whatsapp: { ...whatsappStats, rates: calcRates(whatsappStats) },
  };

  return NextResponse.json({
    overall,
    rates,
    byChannel,
    recentExecutions: executions.slice(0, 5).map((e) => ({
      id: e.id,
      channel: e.channel,
      status: e.status,
      createdAt: e.createdAt,
      sentCount: e.sentCount,
    }))
  });
}
