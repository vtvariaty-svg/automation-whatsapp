import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

const GRAPH = 'https://graph.facebook.com/v22.0';
const SUBSCRIBED_FIELDS = 'messages,comments';

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
  // Subscribe the Instagram professional account to webhook events (best-effort).
  // Using igAccountId (not pageId) so that entry[0].id in incoming webhooks equals the
  // IG account ID, which is the runtime source of truth for Direct messaging.
  console.log(
    `[IG_SUBSCRIBE] attempting igAccountId=${igAccountId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS}`,
  );
  try {
    const subRes = await fetch(
      `${GRAPH}/${igAccountId}/subscribed_apps?subscribed_fields=${SUBSCRIBED_FIELDS}`,
      { method: 'POST', headers: { Authorization: `Bearer ${pageToken}` } },
    );
    const subJson: any = await subRes.json().catch(() => ({}));
    if (subRes.ok && subJson.success) {
      console.log(
        `[IG_SUBSCRIBE] success igAccountId=${igAccountId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS}`,
      );
    } else {
      console.error(
        `[IG_SUBSCRIBE] failed igAccountId=${igAccountId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS} httpStatus=${subRes.status} errCode=${subJson?.error?.code} errSubCode=${subJson?.error?.error_subcode} errMsg=${subJson?.error?.message}`,
      );
    }
  } catch (e: any) {
    console.error(
      `[IG_SUBSCRIBE] error igAccountId=${igAccountId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS} err=${e?.message}`,
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      // Page access token — used to send Instagram DMs and reply to comments
      instagramToken: encrypt(pageToken),
      // Runtime source of truth for Instagram Direct
      instagramAccountId: igAccountId,
      // Kept for backward compatibility; not used for runtime DM routing
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
