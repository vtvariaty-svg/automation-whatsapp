import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { removeChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      facebookPageId: null,
      facebookToken: null,
      enabledChannels: removeChannel(tenant.enabledChannels, 'facebook'),
    },
  });
  await prisma.facebookConnection.deleteMany({ where: { tenantId: auth.tenantId } });
  audit(auth.tenantId, 'facebook.disconnect', {}, auth.userId);

  return NextResponse.json({ success: true });
}
