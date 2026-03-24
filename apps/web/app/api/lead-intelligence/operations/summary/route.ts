/**
 * GET /api/lead-intelligence/operations/summary
 * Returns tenant-scoped operational aggregate counts for the Prospecção IA module.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

const CLOSED_STAGES = ['won', 'lost'];

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Single fetch — all candidates with only the fields needed for aggregation
  const candidates = await prisma.leadCandidate.findMany({
    where: { tenantId },
    select: {
      pipelineStage: true,
      priority: true,
      ownerUserId: true,
      nextActionAt: true,
      status: true,
      outreachStatus: true,
    },
  });

  let totalLeads = 0;
  let openLeads = 0;
  let convertedLeads = 0;
  let lostLeads = 0;
  let approvedLeads = 0;
  let blockedLeads = 0;
  let noOwnerLeads = 0;
  let dueTodayLeads = 0;
  let overdueLeads = 0;
  let highPriorityLeads = 0;

  const byStage: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const c of candidates) {
    totalLeads++;

    const closed = CLOSED_STAGES.includes(c.pipelineStage);

    if (!closed) openLeads++;
    if (c.pipelineStage === 'won') convertedLeads++;
    if (c.pipelineStage === 'lost') lostLeads++;
    if (c.status === 'approved') approvedLeads++;
    if (c.outreachStatus === 'blocked') blockedLeads++;
    if (!c.ownerUserId && !closed) noOwnerLeads++;
    if (c.priority === 'high' && !closed) highPriorityLeads++;

    if (c.nextActionAt) {
      const d = c.nextActionAt;
      if (!closed) {
        if (d < now) overdueLeads++;
        if (d >= todayStart && d < todayEnd) dueTodayLeads++;
      }
    }

    byStage[c.pipelineStage] = (byStage[c.pipelineStage] ?? 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;
  }

  return NextResponse.json({
    overall: {
      totalLeads,
      openLeads,
      convertedLeads,
      lostLeads,
      approvedLeads,
      blockedLeads,
      noOwnerLeads,
      dueTodayLeads,
      overdueLeads,
      highPriorityLeads,
    },
    byStage: {
      new:           byStage['new']           ?? 0,
      contacted:     byStage['contacted']     ?? 0,
      interested:    byStage['interested']    ?? 0,
      proposal_sent: byStage['proposal_sent'] ?? 0,
      negotiating:   byStage['negotiating']   ?? 0,
      won:           byStage['won']           ?? 0,
      lost:          byStage['lost']          ?? 0,
    },
    byPriority: {
      low:    byPriority['low']    ?? 0,
      normal: byPriority['normal'] ?? 0,
      high:   byPriority['high']   ?? 0,
    },
  });
}
