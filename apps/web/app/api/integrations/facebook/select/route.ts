import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { GRAPH_BASE, graphFetch } from '@/lib/meta/pageDiscovery';
import { connectFacebookPage } from '@/lib/facebook/persist';

// Confirms the Facebook page selection after a pending OAuth.
// Re-fetches the page access token server-side using the stored user token.
// Never accepts or trusts any token from the browser.

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let selectedPageId: string;
  try {
    const body = await request.json();
    selectedPageId = body.pageId;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (!selectedPageId) return NextResponse.json({ error: 'pageId_required' }, { status: 400 });

  const conn = await prisma.facebookConnection.findUnique({ where: { tenantId: auth.tenantId } });
  if (!conn || conn.status !== 'pending_selection' || !conn.accessToken || !conn.pageId) {
    return NextResponse.json({ error: 'no_pending_selection' }, { status: 400 });
  }

  let candidates: Array<{
    pageId: string;
    pageName: string;
    tasks: string[];
    eligibleForMessaging: boolean;
  }>;
  try {
    candidates = JSON.parse(conn.pageId);
  } catch {
    return NextResponse.json({ error: 'invalid_pending_data' }, { status: 400 });
  }

  const candidate = candidates.find((c) => c.pageId === selectedPageId);
  if (!candidate) return NextResponse.json({ error: 'invalid_page_selection' }, { status: 400 });

  // Server-side eligibility guard
  if (!candidate.eligibleForMessaging) {
    console.warn(`[FB_CONNECT] select attempt on ineligible page ${selectedPageId} for tenant=${auth.tenantId}`);
    return NextResponse.json({ error: 'page_not_eligible' }, { status: 400 });
  }

  // Re-fetch page access token server-side using the stored long-lived user token
  const userToken = decrypt(conn.accessToken);
  const pagesResult = await graphFetch(
    `${GRAPH_BASE}/me/accounts?fields=id,access_token&access_token=${userToken}`,
  );

  if (!pagesResult.ok) {
    console.error('[FB_CONNECT] select: failed to re-fetch pages', {
      code: pagesResult.graphError?.code,
      message: pagesResult.graphError?.message,
    });
    return NextResponse.json({ error: 'page_token_refresh_failed' }, { status: 500 });
  }

  const page = pagesResult.data?.data?.find((p: any) => p.id === selectedPageId);
  if (!page?.access_token) {
    console.error(`[FB_CONNECT] select: page ${selectedPageId} not found in token list for tenant=${auth.tenantId}`);
    return NextResponse.json({ error: 'page_token_not_found' }, { status: 400 });
  }

  console.log(`[FB_CONNECT] select: persisting pageId=${candidate.pageId} for tenant=${auth.tenantId}`);

  try {
    await connectFacebookPage({
      tenantId: auth.tenantId,
      pageId: candidate.pageId,
      pageName: candidate.pageName,
      pageToken: page.access_token,
    });
  } catch (e: any) {
    console.error('[FB_CONNECT] select: persist failed', e.message);
    return NextResponse.json({ error: e.message || 'persist_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, pageName: candidate.pageName });
}
