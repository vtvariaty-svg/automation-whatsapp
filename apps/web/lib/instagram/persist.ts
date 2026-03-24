import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

const GRAPH = 'https://graph.facebook.com/v22.0';

export async function persistInstagramConnection({
  tenantId,
  pageId,
  pageName,
  pageToken,
  igAccountId,
  username,
}: {
  tenantId: string;
  pageId: string;
  pageName: string;
  pageToken: string;
  igAccountId: string;
  username: string | null;
}) {
  // Subscribe the Facebook Page to Instagram webhook events (best-effort)
  try {
    await fetch(`${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,instagram_manage_messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pageToken}` },
    });
  } catch {}

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      // Page access token — webhook uses this to send Instagram DMs
      instagramToken: encrypt(pageToken),
      // Instagram Business Account ID — for reference
      instagramAccountId: igAccountId,
      // IMPORTANT: instagramPageId must be the Facebook Page ID, not the IG Account ID.
      // The webhook resolves tenants by instagramPageId, and body.entry[0].id is the Facebook Page ID.
      instagramPageId: pageId,
      enabledChannels: addChannel(tenant.enabledChannels, 'instagram'),
    },
  });

  await prisma.instagramConnection.upsert({
    where: { tenantId },
    create: {
      tenantId,
      pageId,
      accessToken: encrypt(pageToken),
      igAccountId,
      username,
      status: 'connected',
    },
    update: {
      pageId,
      accessToken: encrypt(pageToken),
      igAccountId,
      username,
      status: 'connected',
    },
  });

  audit(tenantId, 'instagram.connect', { igAccountId, pageId, pageName, username });
}
