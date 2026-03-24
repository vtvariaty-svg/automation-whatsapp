import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { persistInstagramConnection } from '@/lib/instagram/persist';

// Instagram API with Facebook Login callback.
// Replaces the previous Instagram Login flow (api.instagram.com / graph.instagram.com).
// Uses Graph API to resolve the Facebook Page → Instagram Business Account link.
//
// Flow:
//   1 candidate  → auto-connect
//   >1 candidates → store pending_selection, redirect to ?instagram_select=1
//   0 candidates  → redirect with diagnostic error

const GRAPH = 'https://graph.facebook.com/v22.0';

// Probe a single Facebook Page for its linked Instagram Business Account.
// The batch /me/accounts call sometimes omits instagram_business_account even when
// the link exists — an individual probe is significantly more reliable.
async function probeIgAccount(pageId: string, pageToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
    const data = await res.json();
    return data.instagram_business_account?.id || null;
  } catch {
    return null;
  }
}

type Candidate = { pageId: string; pageName: string; igAccountId: string; username: string | null };

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

    // Step 3: List user's Facebook Pages
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    const pages: any[] = pagesData.data || [];

    // Step 4: Build candidates list.
    // The batch call may omit instagram_business_account even when a link exists.
    // Probe each page without the field individually as a fallback (in parallel).
    const candidatesMap = new Map<string, Candidate>();

    await Promise.all(
      pages.map(async (page) => {
        let igAccountId: string | null = page.instagram_business_account?.id || null;
        if (!igAccountId) igAccountId = await probeIgAccount(page.id, page.access_token);
        if (!igAccountId) return;

        let username: string | null = null;
        try {
          const igRes = await fetch(`${GRAPH}/${igAccountId}?fields=username&access_token=${page.access_token}`);
          const igData = await igRes.json();
          username = igData.username || null;
        } catch {}

        candidatesMap.set(page.id, { pageId: page.id, pageName: page.name, igAccountId, username });
      })
    );

    const candidates = Array.from(candidatesMap.values());

    if (candidates.length === 0) {
      const detail = pages.length > 0 ? `found_${pages.length}_pages_no_ig` : 'no_pages_found';
      console.error('[Instagram/FB callback] no eligible pages. Total pages:', pages.length, JSON.stringify(pagesData));
      return NextResponse.redirect(`${base}/dashboard/integrations?error=no_instagram_account&detail=${detail}`);
    }

    if (candidates.length === 1) {
      // Single candidate — auto-connect (same behavior as before)
      const { pageId, pageName, igAccountId, username } = candidates[0];
      const pageToken: string = pages.find((p) => p.id === pageId)!.access_token;
      await persistInstagramConnection({ tenantId, pageId, pageName, pageToken, igAccountId, username });
      return NextResponse.redirect(
        `${base}/dashboard/integrations?success=instagram&username=${username || pageName || ''}`
      );
    }

    // Multiple candidates — store pending selection so the user can choose.
    // When status='pending_selection':
    //   accessToken = encrypt(userToken)       — re-fetch page tokens on confirmation
    //   pageId      = JSON.stringify(Candidate[]) — list of options WITHOUT page tokens
    await prisma.instagramConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        status: 'pending_selection',
        accessToken: encrypt(userToken),
        pageId: JSON.stringify(candidates),
        igAccountId: null,
        username: null,
      },
      update: {
        status: 'pending_selection',
        accessToken: encrypt(userToken),
        pageId: JSON.stringify(candidates),
        igAccountId: null,
        username: null,
      },
    });

    return NextResponse.redirect(`${base}/dashboard/integrations?instagram_select=1`);
  } catch (e: any) {
    console.error('[Instagram/FB callback]', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
