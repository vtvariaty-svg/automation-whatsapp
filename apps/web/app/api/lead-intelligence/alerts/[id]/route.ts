/**
 * GET   /api/lead-intelligence/alerts/[id]
 *   Returns a single alert with lightweight lead + run context.
 *
 * PATCH /api/lead-intelligence/alerts/[id]
 *   Updates alert status.
 *   Body: { action: "acknowledge" | "resolve" | "reopen" }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

const ALERT_SELECT = {
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
} as const;

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.leadOperationalAlert.findFirst({
    where:  { id, tenantId: auth.tenantId },
    select: ALERT_SELECT,
  });

  if (!alert) return NextResponse.json({ error: 'Alerta não encontrado.' }, { status: 404 });

  return NextResponse.json({ alert });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

interface PatchBody {
  action?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.leadOperationalAlert.findFirst({
    where:  { id, tenantId: auth.tenantId },
    select: { id: true, status: true },
  });

  if (!existing) return NextResponse.json({ error: 'Alerta não encontrado.' }, { status: 404 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action : null;
  if (!action || !['acknowledge', 'resolve', 'reopen'].includes(action)) {
    return NextResponse.json(
      { error: 'action deve ser "acknowledge", "resolve" ou "reopen".' },
      { status: 422 },
    );
  }

  const now = new Date();
  let data: Record<string, unknown> = {};

  if (action === 'acknowledge') {
    data = { status: 'acknowledged', acknowledgedAt: now };
  } else if (action === 'resolve') {
    data = { status: 'resolved', resolvedAt: now };
  } else if (action === 'reopen') {
    data = { status: 'open', resolvedAt: null, acknowledgedAt: null };
  }

  const updated = await prisma.leadOperationalAlert.update({
    where:  { id },
    data,
    select: ALERT_SELECT,
  });

  return NextResponse.json({ alert: updated });
}
