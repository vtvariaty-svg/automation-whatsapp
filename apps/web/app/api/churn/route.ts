/**
 * GET   /api/churn  – detect & return churn signals + playbooks for the authenticated tenant
 * PATCH /api/churn  – dismiss or mark a playbook as converted
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { detectChurnSignals } from '@/lib/churnDetection';

// ─── GET /api/churn ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;

  // Run fresh detection (upserts internally, so safe to call on every load)
  const signals = await detectChurnSignals(tenantId);

  const playbooks = await prisma.churnPlaybook.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ signals, playbooks });
}

// ─── PATCH /api/churn ─────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;

  const body = await request.json() as {
    playbookId: string;
    action: 'dismiss' | 'mark_converted';
  };

  if (!body.playbookId || !body.action) {
    return NextResponse.json({ error: 'playbookId and action required' }, { status: 400 });
  }

  const newStatus = body.action === 'dismiss' ? 'dismissed' : 'converted';

  await prisma.churnPlaybook.update({
    where: { id: body.playbookId, tenantId },
    data: { status: newStatus },
  });

  return NextResponse.json({ ok: true });
}
