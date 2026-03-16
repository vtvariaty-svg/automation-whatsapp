/**
 * GET  /api/admin/go-live/:tenantId  — superadmin or tenant's own admin
 * PATCH /api/admin/go-live/:tenantId  — superadmin (block/unblock) or tenant admin (activate/pause/deactivate)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { computeGoLiveStatus } from '@/lib/goLive';
import { audit } from '@/lib/audit';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = await params;

  // Allow superadmin OR tenant's own admin
  const isSuperadmin = auth.role === 'superadmin';
  const isSelfAdmin = auth.tenantId === tenantId && auth.role === 'admin';
  if (!isSuperadmin && !isSelfAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = await computeGoLiveStatus(tenantId);

  // Auto-update operational status based on checklist
  if (status.allPassed && status.operationalStatus === 'setup') {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { operationalStatus: 'ready' },
    });
    status.operationalStatus = 'ready';
  } else if (!status.allPassed && status.operationalStatus === 'ready') {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { operationalStatus: 'setup' },
    });
    status.operationalStatus = 'setup';
  }

  return NextResponse.json(status);
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = await params;

  const isSuperadmin = auth.role === 'superadmin';
  const isSelfAdmin = auth.tenantId === tenantId && auth.role === 'admin';
  if (!isSuperadmin && !isSelfAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action as string | undefined;
  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  // Superadmin-only actions
  if ((action === 'block' || action === 'unblock') && !isSuperadmin) {
    return NextResponse.json({ error: 'Forbidden — superadmin required' }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { operationalStatus: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const currentStatus = tenant.operationalStatus;
  let newStatus: string;

  switch (action) {
    case 'activate': {
      if (currentStatus !== 'ready') {
        return NextResponse.json(
          { error: `Cannot activate from status '${currentStatus}' — tenant must be 'ready'` },
          { status: 422 },
        );
      }
      // Verify all checks still pass before activating
      const goLiveStatus = await computeGoLiveStatus(tenantId);
      if (!goLiveStatus.allPassed) {
        return NextResponse.json(
          { error: 'Cannot activate — not all checklist items passed' },
          { status: 422 },
        );
      }
      newStatus = 'live';
      break;
    }

    case 'pause': {
      if (currentStatus !== 'live') {
        return NextResponse.json(
          { error: `Cannot pause from status '${currentStatus}' — tenant must be 'live'` },
          { status: 422 },
        );
      }
      newStatus = 'paused';
      break;
    }

    case 'block': {
      // superadmin only (checked above), any status
      newStatus = 'blocked';
      break;
    }

    case 'unblock': {
      // superadmin only (checked above)
      if (currentStatus !== 'blocked') {
        return NextResponse.json(
          { error: `Cannot unblock from status '${currentStatus}' — tenant must be 'blocked'` },
          { status: 422 },
        );
      }
      newStatus = 'paused';
      break;
    }

    case 'deactivate': {
      if (currentStatus !== 'live' && currentStatus !== 'paused') {
        return NextResponse.json(
          { error: `Cannot deactivate from status '${currentStatus}' — tenant must be 'live' or 'paused'` },
          { status: 422 },
        );
      }
      newStatus = 'setup';
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { operationalStatus: newStatus },
  });

  await audit(
    tenantId,
    `go_live.${action}`,
    { previousStatus: currentStatus, newStatus },
    auth.userId,
  );

  return NextResponse.json({ ok: true, newStatus });
}
