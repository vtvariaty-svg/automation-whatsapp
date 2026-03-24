import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

// Instagram API with Facebook Login callback.
// Replaces the previous Instagram Login flow (api.instagram.com / graph.instagram.com).
// Uses Graph API to resolve the Facebook Page → Instagram Business Account link.

const GRAPH = 'https://graph.facebook.com/v22.0';

export async function GET(req: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=${error || 'missing_code'}`);
  }

  let tenantId: string;
  try {
    tenantId = JSON.parse(Buffer.from(stateRaw, 'base64').toString()).tenantId;
  } catch {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid_state`);
  }

  // Same Facebook App credentials used by WhatsApp Embedded Signup and Facebook Messenger
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_instagram_config`);
  }

  const redirectUri = `${base}/api/integrations/instagram/callback`;

  try {
    // Step 1: Exchange authorization code → short-lived user access token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Instagram/FB callback] token exchange failed:', tokenData);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);
    }

    // Step 2: Extend to long-lived user access token (~60 days)
    const llRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const llData = await llRes.json();
    const userToken: string = llData.access_token || tokenData.access_token;

    // Step 3: List user's Facebook Pages and their linked Instagram Business Accounts
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();

    // Find the first page that has a linked Instagram Business Account
    const page = pagesData.data?.find((p: any) => p.instagram_business_account);
    if (!page) {
      console.error('[Instagram/FB callback] no page with Instagram Business Account:', pagesData);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=no_instagram_account`);
    }

    // Facebook Page ID — this is what the Instagram webhook sends in body.entry[0].id
    const pageId: string = page.id;
    const pageName: string = page.name;
    const pageToken: string = page.access_token; // Page access token — used to send Instagram DMs
    const igAccountId: string = page.instagram_business_account.id;

    // Step 4: Fetch Instagram username (best-effort, for display only)
    let username: string | null = null;
    try {
      const igRes = await fetch(`${GRAPH}/${igAccountId}?fields=username&access_token=${pageToken}`);
      const igData = await igRes.json();
      username = igData.username || null;
    } catch {}

    // Step 5: Subscribe the Facebook Page to Instagram webhook events (best-effort)
    try {
      await fetch(`${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,instagram_manage_messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}` },
      });
    } catch {}

    // Step 6: Persist
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.redirect(`${base}/dashboard/integrations?error=tenant_not_found`);

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
        pageId,       // Facebook Page ID — matches instagramPageId in tenant
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

    return NextResponse.redirect(
      `${base}/dashboard/integrations?success=instagram&username=${username || pageName || ''}`
    );
  } catch (e: any) {
    console.error('[Instagram/FB callback]', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
