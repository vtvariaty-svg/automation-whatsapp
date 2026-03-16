import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { removeChannel } from '@/lib/channels/featureFlags';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      instagramPageId: null,
      instagramToken: null,
      instagramAccountId: null,
      enabledChannels: removeChannel(tenant.enabledChannels, 'instagram'),
    },
  });
  await prisma.instagramConnection.deleteMany({ where: { tenantId: auth.tenantId } });

  return NextResponse.json({ success: true });
}
