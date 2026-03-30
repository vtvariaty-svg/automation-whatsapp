import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';
import { persistInstagramConnection } from '@/lib/instagram/persist';
import { GRAPH_BASE, graphFetch, discoverInstagramCandidates } from '@/lib/meta/pageDiscovery';

// Instagram API with Facebook Login callback.
// Replaces the previous Instagram Login flow (api.instagram.com / graph.instagram.com).
// Uses Graph API to resolve the Facebook Page → Instagram Business Account link.
//
// Flow:
//   1 eligible candidate  → auto-connect
//   >1 eligible candidates → store pending_selection, redirect to ?instagram_select=1
//   0 eligible candidates  → redirect with precise diagnostic error code

// Public-safe candidate shape stored in DB (no pageToken).
type StoredCandidate = {
  pageId: string;
  pageName: string;
  igAccountId: string;
  username: string | null;
  tasks: string[];
  eligibleForMessaging: boolean;
  diagnostic: string;
};

export async function GET(req: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');

  console.error(`[IG_CALLBACK_DEBUG] Callback entered. hasCode=${!!code}, hasState=${!!stateRaw}, hasError=${!!error}`);

  if (error || !code || !stateRaw) {
    const reason = error || 'missing_code';
    console.error(`[IG_CALLBACK_DEBUG] Rejecting callback: ${reason}`);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=${reason}`);
  }

  let tenantId: string;
  try {
    tenantId = JSON.parse(Buffer.from(stateRaw, 'base64').toString()).tenantId;
  } catch {
    console.error(`[IG_CALLBACK_DEBUG] Invalid state payload.`);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=invalid_state`);
  }

  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    console.error('[IG_CALLBACK_DEBUG] Missing FB_APP_ID or FB_APP_SECRET');
    return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_instagram_config`);
  }

  const redirectUri = `${base}/api/integrations/instagram/callback`;

  try {
    // Step 1: Exchange authorization code -> short-lived user access token
    const tokenResult = await graphFetch(
      `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    if (!tokenResult.ok || !tokenResult.data?.access_token) {
      console.error('[IG_CONNECT] token exchange failed', {
        code: tokenResult.graphError?.code,
        type: tokenResult.graphError?.type,
        message: tokenResult.graphError?.message,
      });
      return NextResponse.redirect(`${base}/dashboard/integrations?error=token_exchange`);
    }
    const shortLivedToken: string = tokenResult.data.access_token;

    // Step 2: Extend to long-lived user access token (~60 days)
    const llResult = await graphFetch(
      `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
    );
    const userToken: string = llResult.data?.access_token || shortLivedToken;

    console.error(`[IG_CALLBACK_DEBUG] A. TOKEN EXCHANGE RESULT: shortLivedTokenReceived=${!!shortLivedToken}, longLivedTokenReceived=${!!llResult.data?.access_token}`);

    console.log(`[IG_CONNECT] tokens obtained for tenant=${tenantId}; starting page discovery`);

    // Step 3–5: Discover Instagram candidates via shared helper
    const { candidates, ineligible, topDiagnostic, pagesFound, pagesWithIg } =
      await discoverInstagramCandidates(userToken);

    console.error(
      `[IG_CALLBACK_DEBUG] Final discovery result summary: tenant=${tenantId} pagesFound=${pagesFound} pagesWithIg=${pagesWithIg} eligible=${candidates.length} ineligible=${ineligible.length} diagnostic=${topDiagnostic}`,
    );

    if (candidates.length === 0) {
      // Build a richer error payload for the UI
      const detail = encodeURIComponent(
        JSON.stringify({
          pagesFound,
          pagesWithIg,
          ineligible: ineligible.map((c) => ({
            pageId: c.pageId,
            pageName: c.pageName,
            igAccountId: c.igAccountId || null,
            tasks: c.tasks,
            diagnostic: c.diagnostic,
          })),
        }),
      );
      console.error(`[IG_CALLBACK_DEBUG] No candidates found. Final Conclusion: ${topDiagnostic}`);
      return NextResponse.redirect(
        `${base}/dashboard/integrations?error=${topDiagnostic}&detail=${detail}`,
      );
    }

    if (candidates.length === 1) {
      // Single eligible candidate → auto-connect
      const c = candidates[0];
      console.log(`[IG_CONNECT] auto-connecting single candidate pageId=${c.pageId} igAccountId=${c.igAccountId}`);
      await persistInstagramConnection({
        tenantId,
        pageId: c.pageId,
        pageName: c.pageName,
        pageToken: c.pageToken,
        igAccountId: c.igAccountId,
        username: c.username,
      });
      console.error(`[IG_CALLBACK_DEBUG] Auto-connecting single candidate. Final Conclusion: ok`);
      return NextResponse.redirect(
        `${base}/dashboard/integrations?success=instagram&username=${encodeURIComponent(c.username || c.pageName || '')}`,
      );
    }

    // Multiple eligible candidates → store pending selection.
    // IMPORTANT: pageToken is NOT stored in the JSON payload (browser-accessible).
    // It is re-fetched server-side in /select using the encrypted userToken.
    const storedCandidates: StoredCandidate[] = candidates.map((c) => ({
      pageId: c.pageId,
      pageName: c.pageName,
      igAccountId: c.igAccountId,
      username: c.username,
      tasks: c.tasks,
      eligibleForMessaging: c.eligibleForMessaging,
      diagnostic: c.diagnostic,
    }));

    // Include ineligible pages (no messaging task) so UI can show them as disabled
    const allForSelector: StoredCandidate[] = [
      ...storedCandidates,
      ...ineligible
        .map((c) => ({
          pageId: c.pageId,
          pageName: c.pageName,
          igAccountId: c.igAccountId,
          username: c.username,
          tasks: c.tasks,
          eligibleForMessaging: false,
          diagnostic: c.diagnostic,
        })),
    ];

    console.error(`[IG_CALLBACK_DEBUG] Multiple candidates found. tenant=${tenantId} storing ${allForSelector.length} selector entries. Final Conclusion: pending_selection`);

    await prisma.instagramConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        status: 'pending_selection',
        accessToken: encrypt(userToken),   // long-lived user token — server-side only
        pageId: JSON.stringify(allForSelector),
        igAccountId: null,
        username: null,
      },
      update: {
        status: 'pending_selection',
        accessToken: encrypt(userToken),
        pageId: JSON.stringify(allForSelector),
        igAccountId: null,
        username: null,
      },
    });

    return NextResponse.redirect(`${base}/dashboard/integrations?instagram_select=1`);
  } catch (e: any) {
    console.error('[IG_CONNECT] unexpected error', e.message);
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
