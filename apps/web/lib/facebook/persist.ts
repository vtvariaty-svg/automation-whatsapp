/**
 * Shared Facebook Messenger connection persistence helper.
 * Extracted to avoid exporting non-HTTP-handler functions from Next.js route files.
 */

import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';
import { GRAPH_BASE } from '@/lib/meta/pageDiscovery';

export async function connectFacebookPage({
  tenantId,
  pageId,
  pageName,
  pageToken,
}: {
  tenantId: string;
  pageId: string;
  pageName: string;
  pageToken: string;
}) {
  // Subscribe page to Messenger webhook (best-effort)
  try {
    await fetch(`${GRAPH_BASE}/${pageId}/subscribed_apps?subscribed_fields=messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pageToken}` },
    });
  } catch {}

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      facebookPageId: pageId,
      facebookToken: encrypt(pageToken),
      enabledChannels: addChannel(tenant.enabledChannels, 'facebook'),
    },
  });

  await prisma.facebookConnection.upsert({
    where: { tenantId },
    create: { tenantId, pageId, pageName, accessToken: encrypt(pageToken), status: 'connected' },
    update: { pageId, pageName, accessToken: encrypt(pageToken), status: 'connected' },
  });

  audit(tenantId, 'facebook.connect', { pageId, pageName });
}
