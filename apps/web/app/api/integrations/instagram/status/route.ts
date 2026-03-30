import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conn = await prisma.instagramConnection.findUnique({ where: { tenantId: auth.tenantId } });

  // connected        → OAuth link exists (status is 'connected' OR 'subscription_failed')
  // readyForMessages → OAuth link AND webhook subscription both confirmed working
  // subscriptionOk   → same as readyForMessages; explicit field for frontend branching
  // tokenPresent     → encrypted access token exists in DB
  const connected = !!(conn && (conn.status === 'connected' || conn.status === 'subscription_failed'));
  const readyForMessages = conn?.status === 'connected';
  const subscriptionOk = conn?.status === 'connected';
  const tokenPresent = !!(conn?.accessToken);

  return NextResponse.json({
    connected,
    readyForMessages,
    subscriptionOk,
    tokenPresent,
    tokenExpiresAt: conn?.tokenExpiresAt ?? null,
    igUserId: conn?.igAccountId || null,   // igAccountId field stores the IG user ID
    username: conn?.username || null,
  });
}
