import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';

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

  const redirectUri = `${base}/api/integrations/facebook/callback`;

  try {
    const tokenRes = await fetch(`${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);

    const llRes = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
    const llData = await llRes.json();
    const userToken = llData.access_token || tokenData.access_token;

    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page) return NextResponse.redirect(`${base}/dashboard/integrations?error=no_facebook_page`);

    const pageToken = page.access_token;
    const pageId: string = page.id;
    const pageName: string = page.name;

    // Subscribe page
    try {
      await fetch(`${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}` },
      });
    } catch {}

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.redirect(`${base}/dashboard/integrations?error=tenant_not_found`);

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

    return NextResponse.redirect(`${base}/dashboard/integrations?success=facebook&page=${pageName}`);
  } catch (e: any) {
    console.error('[Facebook callback]', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
