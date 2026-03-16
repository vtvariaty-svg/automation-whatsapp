/**
 * POST /api/admin/diagnostics/:tenantId/actions
 * Superadmin only — operational actions on a tenant.
 *
 * Supported actions:
 *   pause_automations    — sets all AutomationRules active: false
 *   resume_automations   — sets all AutomationRules active: true
 *   toggle_kill_switch   — payload.channel: toggles that channel in Tenant.channelKillSwitch
 *   resolve_dead_letter  — payload.deadLetterId: marks DeadLetterEvent resolved
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { audit } from '@/lib/audit';

type Action =
  | 'pause_automations'
  | 'resume_automations'
  | 'toggle_kill_switch'
  | 'resolve_dead_letter';

function toggleChannel(current: string | null, channel: string): string {
  const set = new Set((current ?? '').split(',').filter(Boolean));
  if (set.has(channel)) {
    set.delete(channel);
  } else {
    set.add(channel);
  }
  return [...set].join(',');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;
  const body: { action: Action; payload?: Record<string, unknown> } = await request.json();
  const { action, payload } = body;

  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  switch (action) {
    case 'pause_automations': {
      const result = await prisma.automationRule.updateMany({
        where: { tenantId },
        data: { active: false },
      });
      await audit(tenantId, 'admin.pause_automations', { by: auth.userId }, auth.userId);
      return NextResponse.json({ ok: true, action, affected: result.count });
    }

    case 'resume_automations': {
      const result = await prisma.automationRule.updateMany({
        where: { tenantId },
        data: { active: true },
      });
      await audit(tenantId, 'admin.resume_automations', { by: auth.userId }, auth.userId);
      return NextResponse.json({ ok: true, action, affected: result.count });
    }

    case 'toggle_kill_switch': {
      const channel = payload?.channel as string | undefined;
      if (!channel) return NextResponse.json({ error: 'payload.channel required' }, { status: 400 });

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { channelKillSwitch: true },
      });
      if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

      const newKillSwitch = toggleChannel(tenant.channelKillSwitch ?? null, channel);
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { channelKillSwitch: newKillSwitch || null },
      });

      const isNowKilled = newKillSwitch.split(',').includes(channel);
      await audit(
        tenantId,
        isNowKilled ? 'admin.kill_switch_on' : 'admin.kill_switch_off',
        { channel, by: auth.userId },
        auth.userId,
      );
      return NextResponse.json({ ok: true, action, channelKillSwitch: newKillSwitch || null });
    }

    case 'resolve_dead_letter': {
      const deadLetterId = payload?.deadLetterId as string | undefined;
      if (!deadLetterId) return NextResponse.json({ error: 'payload.deadLetterId required' }, { status: 400 });

      await prisma.deadLetterEvent.update({
        where: { id: deadLetterId },
        data: { status: 'resolved', resolvedAt: new Date() },
      });
      await audit(
        tenantId,
        'admin.resolve_dead_letter',
        { deadLetterId, by: auth.userId },
        auth.userId,
      );
      return NextResponse.json({ ok: true, action });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
