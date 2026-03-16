import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

const GRAPH = 'https://graph.facebook.com/v22.0';

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=${error || 'missing_code'}`);
  }

  let tenantId: string;
  try { tenantId = JSON.parse(Buffer.from(stateRaw, 'base64').toString()).tenantId; }
  catch { return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid_state`); }

  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_config`);

  const redirectUri = `${base}/api/integrations/instagram/callback`;

  try {
    // Exchange code → short-lived token
    const tokenRes = await fetch(`${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);

    // Extend to long-lived
    const llRes = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
    const llData = await llRes.json();
    const userToken = llData.access_token || tokenData.access_token;

    // Find page with Instagram Business account
    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.find((p: any) => p.instagram_business_account);
    if (!page) return NextResponse.redirect(`${base}/dashboard/integrations?error=no_instagram_account`);

    const pageToken = page.access_token;
    const igAccountId: string = page.instagram_business_account.id;
    const pageId: string = page.id;

    let username: string | null = null;
    try {
      const igRes = await fetch(`${GRAPH}/${igAccountId}?fields=username&access_token=${pageToken}`);
      username = (await igRes.json()).username || null;
    } catch {}

    // Subscribe page webhook
    try {
      await fetch(`${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}` },
      });
    } catch {}

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.redirect(`${base}/dashboard/integrations?error=tenant_not_found`);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        instagramPageId: pageId,
        instagramToken: encrypt(pageToken),
        instagramAccountId: igAccountId,
        enabledChannels: addChannel(tenant.enabledChannels, 'instagram'),
      },
    });

    await prisma.instagramConnection.upsert({
      where: { tenantId },
      create: { tenantId, pageId, accessToken: encrypt(pageToken), igAccountId, username, status: 'connected' },
      update: { pageId, accessToken: encrypt(pageToken), igAccountId, username, status: 'connected' },
    });

    audit(tenantId, 'instagram.connect', { pageId, igAccountId, username });

    return NextResponse.redirect(`${base}/dashboard/integrations?success=instagram&username=${username || ''}`);
  } catch (e: any) {
    console.error('[Instagram callback]', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
