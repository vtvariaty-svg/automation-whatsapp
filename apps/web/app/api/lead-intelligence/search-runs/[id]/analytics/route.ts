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

  const executionIds = executions.map((e: any) => e.id);

  const items = await prisma.leadCampaignExecutionItem.findMany({
    where: { executionId: { in: executionIds }, tenantId: auth.tenantId }
  });

  function aggr(list: any[]) {
    const totalSent = list.filter((i: any) => i.status === 'sent').length;
    const stats: any = {
      totalRequested: 0,
      totalEligible: 0,
      totalSent,
      totalFailed: list.filter((i: any) => i.status === 'failed').length,
      totalSkipped: list.filter((i: any) => i.status === 'skipped').length,
      
      totalDelivered: list.filter((i: any) => i.responseStatus === 'delivered' || ['opened', 'replied', 'qualified', 'converted', 'lost'].includes(i.responseStatus)).length,
      totalOpened: list.filter((i: any) => i.responseStatus === 'opened' || ['replied', 'qualified', 'converted', 'lost'].includes(i.responseStatus)).length,
      totalReplied: list.filter((i: any) => i.responseStatus === 'replied' || ['qualified', 'converted', 'lost'].includes(i.responseStatus)).length,
      totalQualified: list.filter((i: any) => i.responseStatus === 'qualified' || ['converted'].includes(i.responseStatus)).length,
      totalConverted: list.filter((i: any) => i.responseStatus === 'converted').length,
      totalLost: list.filter((i: any) => i.responseStatus === 'lost').length,
      totalUnsubscribed: list.filter((i: any) => i.responseStatus === 'unsubscribed').length,
      totalConversionValue: list.reduce((acc: number, curr: any) => acc + (curr.conversionValue || 0), 0)
    };
    return stats;
  }

  const overallStats = aggr(items);
  overallStats.totalRequested = executions.reduce((acc: number, curr: any) => acc + curr.requestedCount, 0);
  overallStats.totalEligible = executions.reduce((acc: number, curr: any) => acc + curr.eligibleCount, 0);
  overallStats.totalExecutions = executions.length;

  const emailItems = items.filter((i: any) => i.channel === 'email');
  const whatsappItems = items.filter((i: any) => i.channel === 'whatsapp');

  function calcRates(stats: any) {
    const sent = stats.totalSent || 0;
    if (sent === 0) return { replyRate: 0, qualificationRate: 0, conversionRate: 0, unsubscribeRate: 0 };
    return {
      replyRate: stats.totalReplied / sent,
      qualificationRate: stats.totalQualified / sent,
      conversionRate: stats.totalConverted / sent,
      unsubscribeRate: stats.totalUnsubscribed / sent
    };
  }

  const overall = overallStats;
  const rates = calcRates(overall);

  const byChannel: any = {
    email: {
      ...aggr(emailItems),
      totalRequested: executions.filter((e: any) => e.channel === 'email').reduce((a: number, c: any) => a + c.requestedCount, 0),
      totalEligible: executions.filter((e: any) => e.channel === 'email').reduce((a: number, c: any) => a + c.eligibleCount, 0),
      totalExecutions: executions.filter((e: any) => e.channel === 'email').length
    },
    whatsapp: {
      ...aggr(whatsappItems),
      totalRequested: executions.filter((e: any) => e.channel === 'whatsapp').reduce((a: number, c: any) => a + c.requestedCount, 0),
      totalEligible: executions.filter((e: any) => e.channel === 'whatsapp').reduce((a: number, c: any) => a + c.eligibleCount, 0),
      totalExecutions: executions.filter((e: any) => e.channel === 'whatsapp').length
    }
  };

  byChannel.email.rates = calcRates(byChannel.email);
  byChannel.whatsapp.rates = calcRates(byChannel.whatsapp);

  return NextResponse.json({
    overall,
    rates,
    byChannel,
    recentExecutions: executions.slice(0, 5).map((e: any) => ({
      id: e.id,
      channel: e.channel,
      status: e.status,
      createdAt: e.createdAt,
      sentCount: e.sentCount
    }))
  });
}
