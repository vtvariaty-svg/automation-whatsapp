import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

// Instagram Login architecture.
// Runtime host for subscriptions and messaging: graph.instagram.com
// Runtime identity: IG user ID (stored in instagramAccountId / igAccountId)
// Runtime token: IG user access token (stored in instagramToken / accessToken)

const IG_GRAPH = 'https://graph.instagram.com';
const SUBSCRIBED_FIELDS = 'messages,comments';

export async function persistInstagramConnection({
  tenantId,
  igUserId,
  username,
  accessToken,
  tokenExpiresAt,
}: {
  tenantId: string;
  igUserId: string;
  username: string | null;
  accessToken: string;
  tokenExpiresAt: Date | null;
}): Promise<{ subscriptionOk: boolean }> {
  // Subscribe the IG user to webhook events via graph.instagram.com.
  // The result is returned so callers can propagate readiness state to the UI.
  console.log(
    `[IG_SUBSCRIBE] attempting igUserId=${igUserId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS}`,
  );

  let subscriptionOk = false;

  try {
    const subRes = await fetch(
      `${IG_GRAPH}/v22.0/${igUserId}/subscribed_apps?subscribed_fields=${SUBSCRIBED_FIELDS}`,
      { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const subJson: any = await subRes.json().catch(() => ({}));
    if (subRes.ok && subJson.success) {
      subscriptionOk = true;
      console.log(
        `[IG_SUBSCRIBE] success igUserId=${igUserId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS}`,
      );
    } else {
      console.error(
        `[IG_SUBSCRIBE] failed igUserId=${igUserId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS} httpStatus=${subRes.status} errCode=${subJson?.error?.code} errSubCode=${subJson?.error?.error_subcode} errMsg=${subJson?.error?.message}`,
      );
    }
  } catch (e: any) {
    console.error(
      `[IG_SUBSCRIBE] error igUserId=${igUserId} tenantId=${tenantId} fields=${SUBSCRIBED_FIELDS} err=${e?.message}`,
    );
  }

  // 'connected'           → subscription succeeded; webhooks will arrive; DMs are operational
  // 'subscription_failed' → token stored but subscription call failed; DMs will not arrive
  const connectionStatus = subscriptionOk ? 'connected' : 'subscription_failed';
  console.log(
    `[IG_SUBSCRIBE] finalState=${connectionStatus} igUserId=${igUserId} tenantId=${tenantId}`,
  );

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('tenant_not_found');

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      instagramToken: encrypt(accessToken),   // IG user access token
      instagramAccountId: igUserId,           // IG user ID (runtime source of truth)
      instagramPageId: null,                  // deprecated: not used in Instagram Login
      enabledChannels: addChannel(tenant.enabledChannels, 'instagram'),
    },
  });

  await prisma.instagramConnection.upsert({
    where: { tenantId },
    create: {
      tenantId,
      pageId: null,                          // deprecated
      accessToken: encrypt(accessToken),
      igAccountId: igUserId,                 // IG user ID
      username,
      status: connectionStatus,
      tokenExpiresAt,
    },
    update: {
      pageId: null,
      accessToken: encrypt(accessToken),
      igAccountId: igUserId,
      username,
      status: connectionStatus,
      tokenExpiresAt,
    },
  });

  audit(tenantId, 'instagram.connect', { igUserId, username, subscriptionOk });

  return { subscriptionOk };
}
