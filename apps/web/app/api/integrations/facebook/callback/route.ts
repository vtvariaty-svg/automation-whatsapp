import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { GRAPH_BASE, graphFetch, discoverFacebookCandidates } from '@/lib/meta/pageDiscovery';
import { connectFacebookPage } from '@/lib/facebook/persist';
import { isChannelItemAccessible, channelBlockedRedirect } from '@/lib/auth/moduleGuard';

// Facebook Messenger OAuth callback.
//
// IMPORTANT FIX: Previous implementation blindly connected pagesData.data?.[0],
// which is unsafe when a user manages multiple pages.
//
// New behavior:
//   0 eligible pages → redirect with precise error
//   1 eligible page  → auto-connect (same as before, but validated)
//   >1 eligible pages → store pending_selection, redirect to ?facebook_select=1

const PENDING_STATUS = 'pending_selection';

// Public-safe candidate shape (no pageToken)
type StoredFbCandidate = {
  pageId: string;
  pageName: string;
  tasks: string[];
  eligibleForMessaging: boolean;
};

export async function GET(req: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  if (!(await isChannelItemAccessible('facebook'))) return channelBlockedRedirect('facebook', base);

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
    return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_config`);
  }

  const redirectUri = `${base}/api/integrations/facebook/callback`;

  try {
    // Step 1: short-lived token exchange
    const tokenResult = await graphFetch(
      `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    if (!tokenResult.ok || !tokenResult.data?.access_token) {
      console.error('[FB_CONNECT] token exchange failed', {
        code: tokenResult.graphError?.code,
        message: tokenResult.graphError?.message,
      });
      return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);
    }
    const shortLivedToken: string = tokenResult.data.access_token;

    // Step 2: extend to long-lived user token
    const llResult = await graphFetch(
      `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
    );
    const userToken: string = llResult.data?.access_token || shortLivedToken;

    console.log(`[FB_CONNECT] tokens obtained for tenant=${tenantId}; starting page discovery`);

    // Step 3: discover eligible pages
    const { candidates, ineligible, pagesFound } = await discoverFacebookCandidates(userToken);

    console.log(
      `[FB_CONNECT] tenant=${tenantId} pagesFound=${pagesFound} eligible=${candidates.length} ineligible=${ineligible.length}`,
    );

    if (candidates.length === 0) {
      const errorCode = pagesFound === 0 ? 'no_facebook_page' : 'no_eligible_facebook_page';
      console.warn(`[FB_CONNECT] no eligible page for tenant=${tenantId} pagesFound=${pagesFound}`);
      return NextResponse.redirect(`${base}/dashboard/integrations?error=${errorCode}`);
    }

    if (candidates.length === 1) {
      // Single eligible candidate → auto-connect
      const page = candidates[0];
      console.log(`[FB_CONNECT] auto-connecting pageId=${page.pageId} name=${page.pageName} tenant=${tenantId}`);
      await connectFacebookPage({ tenantId, pageId: page.pageId, pageName: page.pageName, pageToken: page.pageToken });
      return NextResponse.redirect(
        `${base}/dashboard/integrations?success=facebook&page=${encodeURIComponent(page.pageName)}`,
      );
    }

    // Multiple eligible candidates → store pending selection
    // pageToken is NOT stored in the JSON payload (browser-visible)
    const storedCandidates: StoredFbCandidate[] = candidates.map((c) => ({
      pageId: c.pageId,
      pageName: c.pageName,
      tasks: c.tasks,
      eligibleForMessaging: c.eligibleForMessaging,
    }));

    const allForSelector: StoredFbCandidate[] = [
      ...storedCandidates,
      ...ineligible.map((c) => ({
        pageId: c.pageId,
        pageName: c.pageName,
        tasks: c.tasks,
        eligibleForMessaging: false,
      })),
    ];

    console.log(`[FB_CONNECT] tenant=${tenantId} storing ${allForSelector.length} selector entries`);

    await prisma.facebookConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        pageId: JSON.stringify(allForSelector),
        pageName: PENDING_STATUS,
        accessToken: encrypt(userToken),
        status: PENDING_STATUS,
      },
      update: {
        pageId: JSON.stringify(allForSelector),
        pageName: PENDING_STATUS,
        accessToken: encrypt(userToken),
        status: PENDING_STATUS,
      },
    });

    return NextResponse.redirect(`${base}/dashboard/integrations?facebook_select=1`);
  } catch (e: any) {
    console.error('[FB_CONNECT] unexpected error', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
