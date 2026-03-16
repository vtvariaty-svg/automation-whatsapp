/**
 * GET   /api/admin/churn/:tenantId  – signals, playbooks & health score for a tenant
 * PATCH /api/admin/churn/:tenantId  – resolve signal, create playbook, dismiss playbook
 *
 * Superadmin only.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { createPlaybookIfNeeded } from '@/lib/churnDetection';

// ─── GET /api/admin/churn/:tenantId ──────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;

  const [signals, playbooks, healthScore] = await Promise.all([
    prisma.churnSignal.findMany({
      where: { tenantId },
      orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.churnPlaybook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenantHealthScore.findUnique({ where: { tenantId } }).catch(() => null),
  ]);

  return NextResponse.json({ signals, playbooks, healthScore });
}

// ─── PATCH /api/admin/churn/:tenantId ────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;

  const body = await request.json() as {
    action: 'resolve_signal' | 'create_playbook' | 'dismiss_playbook';
    signalId?: string;
    playbookId?: string;
    signal?: string;
    playbookAction?: string;
  };

  const { action } = body;

  if (action === 'resolve_signal') {
    if (!body.signalId) {
      return NextResponse.json({ error: 'signalId required' }, { status: 400 });
    }
    await prisma.churnSignal.update({
      where: { id: body.signalId, tenantId },
      data: { resolved: true, resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'create_playbook') {
    if (!body.signal || !body.playbookAction) {
      return NextResponse.json(
        { error: 'signal and playbookAction required' },
        { status: 400 },
      );
    }
    await createPlaybookIfNeeded(tenantId, body.signal, body.playbookAction);
    return NextResponse.json({ ok: true });
  }

  if (action === 'dismiss_playbook') {
    if (!body.playbookId) {
      return NextResponse.json({ error: 'playbookId required' }, { status: 400 });
    }
    await prisma.churnPlaybook.update({
      where: { id: body.playbookId, tenantId },
      data: { status: 'dismissed' },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
