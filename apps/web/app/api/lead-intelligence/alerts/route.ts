/**
 * GET  /api/lead-intelligence/alerts
 *   Returns tenant-scoped operational alerts, newest first.
 *   Query params: status, severity, alertType, limit (max 100)
 *
 * POST /api/lead-intelligence/alerts
 *   Runs a deterministic alert scan across all tenant leads.
 *   Creates/reopens alerts for matching rules; auto-resolves stale ones.
 *   Returns compact scan summary.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

// Stages that mean the lead is closed — no operational alerts needed
const CLOSED_STAGES = ['won', 'lost'];
// Stages where a missing nextActionAt is a meaningful risk
const ADVANCED_STAGES = ['interested', 'proposal_sent', 'negotiating'];
// outreachStatus values that mean "ready to activate"
const READY_STATUSES = ['ready_email', 'ready_whatsapp', 'ready_multichannel'];

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;
  const url = new URL(request.url);

  const statusParam    = url.searchParams.get('status')    ?? null;
  const severityParam  = url.searchParams.get('severity')  ?? null;
  const alertTypeParam = url.searchParams.get('alertType') ?? null;
  const rawLimit       = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit          = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));

  const where: Record<string, unknown> = { tenantId };
  if (statusParam)    where.status    = statusParam;
  if (severityParam)  where.severity  = severityParam;
  if (alertTypeParam) where.alertType = alertTypeParam;

  const alerts = await prisma.leadOperationalAlert.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id:             true,
      alertType:      true,
      severity:       true,
      status:         true,
      title:          true,
      detail:         true,
      ruleKey:        true,
      createdAt:      true,
      updatedAt:      true,
      acknowledgedAt: true,
      resolvedAt:     true,
      leadCandidate: {
        select: {
          id:            true,
          companyName:   true,
          tradeName:     true,
          pipelineStage: true,
          priority:      true,
          nextActionAt:  true,
          ownerUserId:   true,
        },
      },
      searchRun: {
        select: { id: true, niche: true, city: true, state: true },
      },
    },
  });

  return NextResponse.json({ alerts });
}

// ─── POST — alert scan ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;
  const now        = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── 1. Fetch all candidates with the fields needed for rule evaluation ──

  const candidates = await prisma.leadCandidate.findMany({
    where: { tenantId },
    select: {
      id:            true,
      searchRunId:   true,
      pipelineStage: true,
      priority:      true,
      ownerUserId:   true,
      nextActionAt:  true,
      lastContactAt: true,
      status:        true,
      outreachStatus:true,
      createdAt:     true,
      _count:        { select: { campaignDrafts: true } },
    },
  });

  // ── 2. Evaluate rules → build map of ruleKey → alert payload ──────────

  interface AlertPayload {
    alertType: string;
    severity:  string;
    title:     string;
    detail:    string;
    leadCandidateId: string;
    searchRunId:     string;
  }

  const firingAlerts = new Map<string, AlertPayload>();

  for (const c of candidates) {
    if (CLOSED_STAGES.includes(c.pipelineStage)) continue;

    // Rule 1 — overdue_next_action
    if (c.nextActionAt && c.nextActionAt < now) {
      const key = `overdue_next_action::${c.id}`;
      firingAlerts.set(key, {
        alertType: 'overdue_next_action',
        severity:  'high',
        title:     'Próxima ação vencida',
        detail:    `A próxima ação venceu em ${c.nextActionAt.toLocaleDateString('pt-BR')}.`,
        leadCandidateId: c.id,
        searchRunId:     c.searchRunId,
      });
    }

    // Rule 2 — no_owner_high_priority
    if (c.priority === 'high' && !c.ownerUserId) {
      const key = `no_owner_high_priority::${c.id}`;
      firingAlerts.set(key, {
        alertType: 'no_owner_high_priority',
        severity:  'high',
        title:     'Alta prioridade sem responsável',
        detail:    'Lead de alta prioridade não possui responsável atribuído.',
        leadCandidateId: c.id,
        searchRunId:     c.searchRunId,
      });
    }

    // Rule 3 — stalled_follow_up
    const stalled =
      (c.lastContactAt !== null && c.lastContactAt < sevenDaysAgo) ||
      (c.lastContactAt === null && c.createdAt < sevenDaysAgo);
    if (stalled) {
      const key = `stalled_follow_up::${c.id}`;
      firingAlerts.set(key, {
        alertType: 'stalled_follow_up',
        severity:  'medium',
        title:     'Follow-up parado',
        detail:    'Sem contato registrado nos últimos 7 dias.',
        leadCandidateId: c.id,
        searchRunId:     c.searchRunId,
      });
    }

    // Rule 4 — replied_no_next_action
    if (ADVANCED_STAGES.includes(c.pipelineStage) && !c.nextActionAt) {
      const key = `replied_no_next_action::${c.id}`;
      firingAlerts.set(key, {
        alertType: 'replied_no_next_action',
        severity:  'medium',
        title:     'Estágio avançado sem próxima ação',
        detail:    `Lead em estágio "${c.pipelineStage}" sem próxima ação definida.`,
        leadCandidateId: c.id,
        searchRunId:     c.searchRunId,
      });
    }

    // Rule 5 — ready_no_activation (only for approved + ready but no draft yet)
    if (
      c.status === 'approved' &&
      READY_STATUSES.includes(c.outreachStatus) &&
      c._count.campaignDrafts === 0
    ) {
      const key = `ready_no_activation::${c.id}`;
      firingAlerts.set(key, {
        alertType: 'ready_no_activation',
        severity:  'low',
        title:     'Lead pronto sem ativação',
        detail:    'Lead aprovado e com status de outreach pronto, mas sem rascunho de campanha.',
        leadCandidateId: c.id,
        searchRunId:     c.searchRunId,
      });
    }
  }

  // ── 3. Load currently open/acknowledged alerts ─────────────────────────

  const existingAlerts = await prisma.leadOperationalAlert.findMany({
    where: { tenantId, status: { in: ['open', 'acknowledged'] } },
    select: { id: true, ruleKey: true },
  });

  const existingByKey = new Map(existingAlerts.map(a => [a.ruleKey, a.id]));

  // ── 4. Upsert firing alerts ────────────────────────────────────────────

  let created  = 0;
  let reopened = 0;

  for (const [ruleKey, payload] of firingAlerts) {
    const wasExisting = existingByKey.has(ruleKey);
    await prisma.leadOperationalAlert.upsert({
      where:  { tenantId_ruleKey: { tenantId, ruleKey } },
      create: {
        tenantId,
        ruleKey,
        leadCandidateId: payload.leadCandidateId,
        searchRunId:     payload.searchRunId || null,
        alertType:       payload.alertType,
        severity:        payload.severity,
        status:          'open',
        title:           payload.title,
        detail:          payload.detail,
      },
      update: {
        // Reopen if was acknowledged/resolved; refresh title/detail/severity
        status:        'open',
        severity:      payload.severity,
        title:         payload.title,
        detail:        payload.detail,
        acknowledgedAt: null,
        resolvedAt:     null,
        updatedAt:      now,
      },
    });
    if (wasExisting) reopened++; else created++;
  }

  // ── 5. Auto-resolve stale alerts ──────────────────────────────────────

  const toResolveIds = existingAlerts
    .filter(a => !firingAlerts.has(a.ruleKey))
    .map(a => a.id);

  let autoResolved = 0;
  if (toResolveIds.length > 0) {
    const res = await prisma.leadOperationalAlert.updateMany({
      where: { id: { in: toResolveIds } },
      data:  { status: 'resolved', resolvedAt: now },
    });
    autoResolved = res.count;
  }

  // ── 6. Count total open ────────────────────────────────────────────────

  const openTotal = await prisma.leadOperationalAlert.count({
    where: { tenantId, status: { in: ['open', 'acknowledged'] } },
  });

  return NextResponse.json({
    scanned:     candidates.length,
    created,
    reopened,
    autoResolved,
    openTotal,
  });
}
