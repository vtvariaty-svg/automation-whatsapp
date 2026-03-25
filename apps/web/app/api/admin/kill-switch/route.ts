/**
 * PATCH /api/admin/kill-switch
 * Body: { tenantId, channel, paused: boolean }
 * Superadmin: add/remove a channel from Tenant.channelKillSwitch.
 *
 * GET /api/admin/kill-switch?tenantId=  — returns current kill-switch state + circuit status.
 */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';
import { getCircuitSnapshot } from '@/lib/resilience/circuitBreaker';

type Channel = 'whatsapp' | 'instagram' | 'facebook';

function toggleChannel(current: string | null, channel: Channel, add: boolean): string {
  const set = new Set((current ?? '').split(',').filter(Boolean));
  if (add) set.add(channel); else set.delete(channel);
  return [...set].join(',');
}

export async function PATCH(request: Request) {
  const payload = await requireAuth(request);
  if (!payload || !isSuperAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { tenantId, channel, paused } = await request.json();
    if (!tenantId || !channel || paused === undefined)
      return NextResponse.json({ error: 'tenantId, channel, paused required' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const newKillSwitch = toggleChannel(tenant.channelKillSwitch ?? null, channel, paused);
    await prisma.tenant.update({ where: { id: tenantId }, data: { channelKillSwitch: newKillSwitch || null } });

    logSuperAdminAction(payload.userId, paused ? 'kill_switch_on' : 'kill_switch_off', tenantId, { channel });

    return NextResponse.json({ ok: true, channelKillSwitch: newKillSwitch || null });
  } catch (error: any) {
    console.error('[KillSwitch] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload || !isSuperAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { channelKillSwitch: true } });
    const circuits = getCircuitSnapshot();
    const tenantCircuits = Object.fromEntries(
      Object.entries(circuits).filter(([k]) => k.startsWith(tenantId)),
    );

    return NextResponse.json({
      channelKillSwitch: tenant?.channelKillSwitch ?? null,
      circuits: tenantCircuits,
    });
  } catch (error: any) {
    console.error('[KillSwitch] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
