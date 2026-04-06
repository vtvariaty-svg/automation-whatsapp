import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        enabledChannels: true,
        whatsappToken: true,
        instagramToken: true,
        facebookToken: true,
        whatsappConnection: { select: { accessToken: true } },
        instagramConnection: { select: { id: true } },
        facebookConnection: { select: { id: true } },
      },
    });

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const enabled = tenant.enabledChannels
      ? tenant.enabledChannels.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      enabledChannels: enabled,
      whatsappConnected: !!(tenant.whatsappToken || tenant.whatsappConnection?.accessToken),
      instagramConnected: !!(tenant.instagramToken || tenant.instagramConnection),
      facebookConnected: !!(tenant.facebookToken || tenant.facebookConnection),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
