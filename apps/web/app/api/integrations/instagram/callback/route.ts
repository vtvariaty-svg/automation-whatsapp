import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { addChannel } from '@/lib/channels/featureFlags';
import { audit } from '@/lib/audit';

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

  // Instagram-specific credentials (Instagram product in Meta Developer Portal)
  const igAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
  const igAppSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!igAppId || !igAppSecret) {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_instagram_config`);
  }

  const redirectUri = `${base}/api/integrations/instagram/callback`;

  try {
    // Step 1: Exchange authorization code → short-lived token
    // Instagram Business Login uses POST to api.instagram.com
    const tokenForm = new URLSearchParams({
      client_id: igAppId,
      client_secret: igAppSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenForm.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Instagram callback] token exchange failed:', tokenData);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);
    }

    const shortToken: string = tokenData.access_token;

    // Step 2: Extend to long-lived token (60 days)
    const llRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_id=${igAppId}&client_secret=${igAppSecret}&access_token=${shortToken}`
    );
    const llData = await llRes.json();
    const longToken: string = llData.access_token || shortToken;

    // Step 3: Get Instagram user profile
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`
    );
    const profile = await profileRes.json();

    if (!profile.id) {
      console.error('[Instagram callback] profile fetch failed:', profile);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=profile_failed`);
    }

    const igAccountId: string = profile.id;
    const username: string | null = profile.username || null;

    // Step 4: Subscribe to webhooks (best-effort)
    try {
      await fetch(`https://graph.instagram.com/${igAccountId}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${longToken}` },
      });
    } catch {}

    // Step 5: Persist to database
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.redirect(`${base}/dashboard/integrations?error=tenant_not_found`);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        instagramToken: encrypt(longToken),
        instagramAccountId: igAccountId,
        enabledChannels: addChannel(tenant.enabledChannels, 'instagram'),
      },
    });

    await prisma.instagramConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        pageId: null,
        accessToken: encrypt(longToken),
        igAccountId,
        username,
        status: 'connected',
      },
      update: {
        pageId: null,
        accessToken: encrypt(longToken),
        igAccountId,
        username,
        status: 'connected',
      },
    });

    audit(tenantId, 'instagram.connect', { igAccountId, username });

    return NextResponse.redirect(
      `${base}/dashboard/integrations?success=instagram&username=${username || ''}`
    );
  } catch (e: any) {
    console.error('[Instagram callback]', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
