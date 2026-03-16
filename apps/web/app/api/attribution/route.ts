/**
 * POST /api/attribution — record a touch point
 * GET  /api/attribution?contactId= — get attribution for a contact
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import {
  touchAttribution,
  type AttributionSource,
  type AttributionMedium,
} from '@/lib/attribution';

// ─── POST /api/attribution ────────────────────────────────────────────────────

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    contactId?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    conversationId?: string;
    opportunityId?: string;
    appointmentId?: string;
    orderId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contactId, source, medium, campaign, conversationId, opportunityId, appointmentId, orderId } = body;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }
  if (!source) {
    return NextResponse.json({ error: 'source is required' }, { status: 400 });
  }

  const validSources: AttributionSource[] = [
    'instagram_dm',
    'instagram_comment',
    'facebook_dm',
    'whatsapp',
    'manual',
    'template',
  ];
  if (!validSources.includes(source as AttributionSource)) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
      { status: 400 }
    );
  }

  const validMediums: AttributionMedium[] = ['organic', 'paid', 'referral', 'direct'];
  if (medium && !validMediums.includes(medium as AttributionMedium)) {
    return NextResponse.json(
      { error: `Invalid medium. Must be one of: ${validMediums.join(', ')}` },
      { status: 400 }
    );
  }

  await touchAttribution(
    auth.tenantId,
    contactId,
    source as AttributionSource,
    medium as AttributionMedium | undefined,
    campaign,
    { conversationId, opportunityId, appointmentId, orderId }
  );

  return NextResponse.json({ ok: true });
}

// ─── GET /api/attribution?contactId= ─────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');

  if (!contactId) {
    return NextResponse.json({ error: 'contactId query parameter is required' }, { status: 400 });
  }

  const record = await prisma.leadAttribution.findUnique({
    where: {
      tenantId_contactId: { tenantId: auth.tenantId, contactId },
    },
  });

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(record);
}
