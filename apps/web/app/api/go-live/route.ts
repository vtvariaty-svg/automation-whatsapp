/**
 * GET  /api/go-live  — tenant self-service: compute and return GoLiveStatus
 * PATCH /api/go-live  — tenant admin: activate or pause
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { computeGoLiveStatus } from '@/lib/goLive';
import { audit } from '@/lib/audit';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = await computeGoLiveStatus(auth.tenantId);

  // Auto-update operational status based on checklist
  if (status.allPassed && status.operationalStatus === 'setup') {
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: { operationalStatus: 'ready' },
    });
    status.operationalStatus = 'ready';
  } else if (!status.allPassed && status.operationalStatus === 'ready') {
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: { operationalStatus: 'setup' },
    });
    status.operationalStatus = 'setup';
  }

  return NextResponse.json(status);
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action as string | undefined;
  if (!action || !['activate', 'pause'].includes(action)) {
    return NextResponse.json(
      { error: 'action must be "activate" or "pause"' },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { operationalStatus: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const currentStatus = tenant.operationalStatus;
  let newStatus: string;

  if (action === 'activate') {
    if (currentStatus !== 'ready') {
      return NextResponse.json(
        { error: `Cannot activate from status '${currentStatus}' — tenant must be 'ready'` },
        { status: 422 },
      );
    }
    const goLiveStatus = await computeGoLiveStatus(auth.tenantId);
    if (!goLiveStatus.allPassed) {
      return NextResponse.json(
        { error: 'Cannot activate — not all checklist items passed' },
        { status: 422 },
      );
    }
    newStatus = 'live';
  } else {
    // pause
    if (currentStatus !== 'live') {
      return NextResponse.json(
        { error: `Cannot pause from status '${currentStatus}' — tenant must be 'live'` },
        { status: 422 },
      );
    }
    newStatus = 'paused';
  }

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { operationalStatus: newStatus },
  });

  await audit(
    auth.tenantId,
    `go_live.${action}`,
    { previousStatus: currentStatus, newStatus },
    auth.userId,
  );

  return NextResponse.json({ ok: true, newStatus });
}
