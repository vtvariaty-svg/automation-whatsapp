import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { persistInstagramConnection } from '@/lib/instagram/persist';

// Confirms the page selection after a pending Instagram OAuth.
// Re-fetches the page access token using the stored user token, then persists the connection.

const GRAPH = 'https://graph.facebook.com/v22.0';

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
  if (!selectedPageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 });

  const conn = await prisma.instagramConnection.findUnique({ where: { tenantId: auth.tenantId } });
  if (!conn || conn.status !== 'pending_selection' || !conn.accessToken || !conn.pageId) {
    return NextResponse.json({ error: 'no_pending_selection' }, { status: 400 });
  }

  let candidates: Array<{ pageId: string; pageName: string; igAccountId: string; username: string | null }>;
  try {
    candidates = JSON.parse(conn.pageId);
  } catch {
    return NextResponse.json({ error: 'invalid_pending_data' }, { status: 400 });
  }

  const candidate = candidates.find((c) => c.pageId === selectedPageId);
  if (!candidate) return NextResponse.json({ error: 'invalid_page_selection' }, { status: 400 });

  // Re-fetch the page-specific access token using the stored long-lived user token
  const userToken = decrypt(conn.accessToken);
  const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,access_token&access_token=${userToken}`);
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.find((p: any) => p.id === selectedPageId);
  if (!page?.access_token) {
    return NextResponse.json({ error: 'page_token_not_found' }, { status: 400 });
  }

  try {
    await persistInstagramConnection({
      tenantId: auth.tenantId,
      pageId: candidate.pageId,
      pageName: candidate.pageName,
      pageToken: page.access_token,
      igAccountId: candidate.igAccountId,
      username: candidate.username,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'persist_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, username: candidate.username, pageName: candidate.pageName });
}
