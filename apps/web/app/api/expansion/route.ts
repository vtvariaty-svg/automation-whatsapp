import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import {
  detectExpansionTriggers,
  recordExpansionShown,
  recordExpansionConverted,
  suggestNextPlan,
  ExpansionEvent,
} from '@/lib/expansion';

const TRIGGER_PRIORITY = [
  'limit_hit',
  'premium_blocked',
  'wants_multichannel',
  'high_lead_volume',
  'multi_agent',
];

function getHighestPrioritySuggestion(events: ExpansionEvent[]): string | null {
  for (const trigger of TRIGGER_PRIORITY) {
    const event = events.find((e) => e.trigger === trigger);
    if (event?.suggestedPlan) return event.suggestedPlan;
  }
  return null;
}

// GET /api/expansion
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await detectExpansionTriggers(auth.tenantId);

  // Mark all returned events as shown
  await Promise.all(events.map((e) => recordExpansionShown(e.id)));

  const suggestedPlan = getHighestPrioritySuggestion(events);

  return NextResponse.json({ events, suggestedPlan });
}

// POST /api/expansion
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { eventId, action } = body as { eventId: string; action: 'converted' | 'dismissed' };

  if (!eventId || !action) {
    return NextResponse.json({ error: 'Missing eventId or action' }, { status: 400 });
  }

  if (action === 'converted') {
    // Find the event to get trigger info then mark converted
    const prisma = (await import('@/lib/prisma')).default;
    const event = await (prisma as any).expansionEvent.findFirst({
      where: { id: eventId, tenantId: auth.tenantId },
    });
    if (event) {
      await recordExpansionConverted(auth.tenantId, event.trigger);
    }
  } else if (action === 'dismissed') {
    // Just mark shown=true to acknowledge
    await recordExpansionShown(eventId);
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
