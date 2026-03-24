/**
 * GET /api/lead-intelligence/operations/queue
 * Returns tenant-scoped actionable leads across all search runs.
 *
 * Query params:
 *   bucket:      all | open | due_today | overdue | no_owner | converted | lost
 *   stage:       pipelineStage filter
 *   priority:    low | normal | high
 *   ownerUserId: filter by owner
 *   search:      free text over companyName/tradeName/city/state/category
 *   limit:       max 100, default 50
 */
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

const CLOSED_STAGES = ['won', 'lost'];

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;
  const url = new URL(request.url);

  const bucket     = url.searchParams.get('bucket')      ?? 'all';
  const stage      = url.searchParams.get('stage')       ?? null;
  const priority   = url.searchParams.get('priority')    ?? null;
  const ownerParam = url.searchParams.get('ownerUserId') ?? null;
  const search     = url.searchParams.get('search')      ?? null;
  const rawLimit   = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit      = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // ── Build where ──────────────────────────────────────────────────────────

  const where: Prisma.LeadCandidateWhereInput = { tenantId };

  switch (bucket) {
    case 'open':
      where.pipelineStage = { notIn: CLOSED_STAGES };
      break;
    case 'due_today':
      where.nextActionAt  = { gte: todayStart, lt: todayEnd };
      where.pipelineStage = { notIn: CLOSED_STAGES };
      break;
    case 'overdue':
      where.nextActionAt  = { lt: now };
      where.pipelineStage = { notIn: CLOSED_STAGES };
      break;
    case 'no_owner':
      where.ownerUserId   = null;
      where.pipelineStage = { notIn: CLOSED_STAGES };
      break;
    case 'converted':
      where.pipelineStage = 'won';
      break;
    case 'lost':
      where.pipelineStage = 'lost';
      break;
    // 'all': no extra filter
  }

  // Additional filters (override bucket stage if explicitly set)
  if (stage)      where.pipelineStage = stage;
  if (priority)   where.priority      = priority;
  if (ownerParam) where.ownerUserId   = ownerParam;

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { tradeName:   { contains: search, mode: 'insensitive' } },
      { city:        { contains: search, mode: 'insensitive' } },
      { state:       { contains: search, mode: 'insensitive' } },
      { category:    { contains: search, mode: 'insensitive' } },
    ];
  }

  // ── Query ────────────────────────────────────────────────────────────────

  const candidates = await prisma.leadCandidate.findMany({
    where,
    take: limit,
    orderBy: [
      { nextActionAt: { sort: 'asc', nulls: 'last' } },
      { updatedAt: 'desc' },
    ],
    select: {
      id:            true,
      companyName:   true,
      tradeName:     true,
      city:          true,
      state:         true,
      category:      true,
      pipelineStage: true,
      priority:      true,
      nextActionAt:  true,
      lastContactAt: true,
      ownerUserId:   true,
      outreachStatus:true,
      status:        true,
      updatedAt:     true,
      owner: {
        select: { id: true, name: true, email: true },
      },
      score: {
        select: { overallScore: true, verdict: true },
      },
      searchRun: {
        select: { id: true, niche: true, city: true, state: true },
      },
    },
  });

  // ── Sort: overdue → due today → high priority → nextActionAt asc → updatedAt desc ──

  const leads = candidates.sort((a, b) => {
    const aOverdue   = !!a.nextActionAt && a.nextActionAt < now  && !CLOSED_STAGES.includes(a.pipelineStage);
    const bOverdue   = !!b.nextActionAt && b.nextActionAt < now  && !CLOSED_STAGES.includes(b.pipelineStage);
    const aDueToday  = !!a.nextActionAt && a.nextActionAt >= todayStart && a.nextActionAt < todayEnd;
    const bDueToday  = !!b.nextActionAt && b.nextActionAt >= todayStart && b.nextActionAt < todayEnd;
    const aHighPrio  = a.priority === 'high';
    const bHighPrio  = b.priority === 'high';

    if (aOverdue  && !bOverdue)  return -1;
    if (!aOverdue && bOverdue)   return  1;
    if (aDueToday && !bDueToday) return -1;
    if (!aDueToday && bDueToday) return  1;
    if (aHighPrio && !bHighPrio) return -1;
    if (!aHighPrio && bHighPrio) return  1;

    if (a.nextActionAt && b.nextActionAt) {
      return a.nextActionAt.getTime() - b.nextActionAt.getTime();
    }
    if (a.nextActionAt && !b.nextActionAt) return -1;
    if (!a.nextActionAt && b.nextActionAt) return  1;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return NextResponse.json({ leads });
}
