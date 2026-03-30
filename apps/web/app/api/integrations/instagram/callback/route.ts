import { NextResponse } from 'next/server';
import { persistInstagramConnection } from '@/lib/instagram/persist';

// Instagram Login callback.
// Flow:
//   1. Exchange code → short-lived IG user token (api.instagram.com)
//   2. Exchange short-lived → long-lived IG user token (~60 days, graph.instagram.com)
//   3. Fetch IG user id and username (/me on graph.instagram.com)
//   4. Persist and subscribe — no page discovery, no selector
//
// There is no multi-account selection in Instagram Login: the token maps 1:1 to an IG user.

const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const IG_GRAPH = 'https://graph.instagram.com';

export async function GET(req: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  console.log(`[IG_CONNECT] callback entered hasCode=${!!code} hasState=${!!stateRaw} hasError=${!!error}`);

  if (error || !code || !stateRaw) {
    const reason = error || 'missing_code';
    console.error(`[IG_CONNECT] rejecting callback: ${reason}`);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=${reason}`);
  }

  let tenantId: string;
  try {
    tenantId = JSON.parse(Buffer.from(stateRaw, 'base64').toString()).tenantId;
  } catch {
    console.error('[IG_CONNECT] invalid state payload');
    return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid_state`);
  }

  const igAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_FB_APP_ID;
  const igAppSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FB_APP_SECRET;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI || `${base}/api/integrations/instagram/callback`;

  if (!igAppId || !igAppSecret) {
    console.error('[IG_CONNECT] missing INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET');
    return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_instagram_config`);
  }

  try {
    // ── Step 1: code → short-lived IG user token ──────────────────────────────
    const tokenBody = new URLSearchParams({
      client_id: igAppId,
      client_secret: igAppSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(IG_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });
    const tokenJson: any = await tokenRes.json().catch(() => ({}));

    if (!tokenJson.access_token) {
      console.error('[IG_CONNECT] short-lived token exchange failed', tokenJson?.error_message ?? tokenJson?.error);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);
    }

    const shortToken: string = tokenJson.access_token;
    const igUserIdFromToken: string = String(tokenJson.user_id ?? '');
    console.log(`[IG_CONNECT] short-lived token obtained igUserId=${igUserIdFromToken} tenant=${tenantId}`);

    // ── Step 2: short-lived → long-lived IG user token (~60 days) ────────────
    const llRes = await fetch(
      `${IG_GRAPH}/access_token?grant_type=ig_exchange_token&client_id=${igAppId}&client_secret=${igAppSecret}&access_token=${shortToken}`,
    );
    const llJson: any = await llRes.json().catch(() => ({}));
    const accessToken: string = llJson.access_token || shortToken;
    const expiresIn: number | null = llJson.expires_in ?? null;
    const tokenExpiresAt: Date | null = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    console.log(`[IG_CONNECT] long-lived token obtained expiresIn=${expiresIn} tenant=${tenantId}`);

    // ── Step 3: fetch IG user id and username ─────────────────────────────────
    const meRes = await fetch(
      `${IG_GRAPH}/me?fields=id,username&access_token=${accessToken}`,
    );
    const meJson: any = await meRes.json().catch(() => ({}));
    const igUserId: string = meJson.id ? String(meJson.id) : igUserIdFromToken;
    const username: string | null = meJson.username ?? null;

    if (!igUserId) {
      console.error('[IG_CONNECT] could not determine igUserId from /me response', meJson?.error);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=ig_user_id_missing`);
    }
    console.log(`[IG_CONNECT] user info fetched igUserId=${igUserId} username=${username} tenant=${tenantId}`);

    // ── Step 4: persist and subscribe ────────────────────────────────────────
    const { subscriptionOk } = await persistInstagramConnection({
      tenantId,
      igUserId,
      username,
      accessToken,
      tokenExpiresAt,
    });

    console.log(`[IG_CONNECT] connect complete igUserId=${igUserId} subscriptionOk=${subscriptionOk} tenant=${tenantId}`);
    const subSuffix = subscriptionOk ? '' : '&sub=failed';
    return NextResponse.redirect(
      `${base}/dashboard/integrations?success=instagram&username=${encodeURIComponent(username || '')}${subSuffix}`,
    );
  } catch (e: any) {
    console.error('[IG_CONNECT] unexpected error', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
