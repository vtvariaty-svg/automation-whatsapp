/**
 * Shared Meta Graph API page discovery helper.
 *
 * Centralises all Graph API interactions for Instagram and Facebook Messenger
 * page discovery, keeping individual route files thin.
 *
 * Security contract:
 *  - pageToken is NEVER returned to the browser; only present server-side.
 *  - Raw access tokens are never logged.
 */

export const GRAPH_BASE = 'https://graph.facebook.com/v22.0';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
}

/** Safe Graph fetch that surfaces structured errors without logging tokens. */
export async function graphFetch(url: string): Promise<{ ok: boolean; data: any; graphError?: GraphError }> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data?.error) {
      return { ok: false, data, graphError: data.error };
    }
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, data: null, graphError: { message: e.message || 'network_error' } };
  }
}

// ─── Instagram candidate discovery ───────────────────────────────────────────

export type IgDiagnosticCode =
  | 'no_pages_found'
  | 'pages_found_but_no_instagram_link'
  | 'instagram_link_found_but_missing_page_token'
  | 'instagram_link_found_but_missing_messaging_task'
  | 'graph_permission_error'
  | 'ok';

export interface IgCandidate {
  pageId: string;
  pageName: string;
  /** Page-scoped access token — server-side only, never sent to browser. */
  pageToken: string;
  igAccountId: string;
  username: string | null;
  tasks: string[];
  eligibleForMessaging: boolean;
  diagnostic: IgDiagnosticCode;
}

/**
 * Discover Instagram Business accounts linked to pages the user manages.
 *
 * Strategy:
 *  1. GET /me/accounts with user token (returns all managed pages).
 *  2. For each page, GET /{page_id}?fields=name,access_token,tasks,instagram_business_account
 *     using the *user token* (more reliable than page-token-based lookup).
 *  3. If instagram_business_account is still missing, attempt a direct probe
 *     with the page token as the last resort.
 *  4. If IG account found, resolve username.
 *  5. Build structured candidate with eligibility determination.
 */
export async function discoverInstagramCandidates(
  userToken: string,
): Promise<{
  candidates: IgCandidate[];
  ineligible: IgCandidate[];
  topDiagnostic: IgDiagnosticCode;
  pagesFound: number;
  pagesWithIg: number;
}> {
  // Step 1 – list managed pages
  const accountsResult = await graphFetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,tasks&access_token=${userToken}`,
  );

  if (!accountsResult.ok) {
    const isPermErr =
      accountsResult.graphError?.code === 190 ||
      accountsResult.graphError?.code === 200 ||
      accountsResult.graphError?.type === 'OAuthException';
    console.error('[IG_CONNECT] graph /me/accounts failed', {
      code: accountsResult.graphError?.code,
      type: accountsResult.graphError?.type,
      message: accountsResult.graphError?.message,
    });
    return {
      candidates: [],
      ineligible: [],
      topDiagnostic: isPermErr ? 'graph_permission_error' : 'no_pages_found',
      pagesFound: 0,
      pagesWithIg: 0,
    };
  }

  const rawPages: Array<{ id: string; name: string; tasks?: string[] }> =
    accountsResult.data?.data ?? [];

  console.log(`[IG_CONNECT] /me/accounts returned ${rawPages.length} pages`);

  if (rawPages.length === 0) {
    return {
      candidates: [],
      ineligible: [],
      topDiagnostic: 'no_pages_found',
      pagesFound: 0,
      pagesWithIg: 0,
    };
  }

  const candidates: IgCandidate[] = [];
  const ineligible: IgCandidate[] = [];
  let pagesWithIg = 0;

  await Promise.all(
    rawPages.map(async (rawPage) => {
      // Step 2 – full page probe with user token (more fields, more reliable)
      const pageResult = await graphFetch(
        `${GRAPH_BASE}/${rawPage.id}?fields=name,access_token,tasks,instagram_business_account&access_token=${userToken}`,
      );

      const pageData = pageResult.data ?? {};
      const tasks: string[] = pageData.tasks ?? rawPage.tasks ?? [];
      const pageToken: string | undefined = pageData.access_token;
      let igAccountId: string | null = pageData.instagram_business_account?.id ?? null;

      // Step 3 – fallback probe with page token if user-token probe missed the IG link
      if (!igAccountId && pageToken) {
        const fallback = await graphFetch(
          `${GRAPH_BASE}/${rawPage.id}?fields=instagram_business_account&access_token=${pageToken}`,
        );
        igAccountId = fallback.data?.instagram_business_account?.id ?? null;
      }

      if (!igAccountId) {
        // Page found, but no IG link
        console.log(`[IG_CONNECT] page ${rawPage.id} (${rawPage.name}) has no instagram_business_account`);
        if (pageToken) {
          ineligible.push({
            pageId: rawPage.id,
            pageName: rawPage.name,
            pageToken,
            igAccountId: '',
            username: null,
            tasks,
            eligibleForMessaging: false,
            diagnostic: 'pages_found_but_no_instagram_link',
          });
        }
        return;
      }

      pagesWithIg += 1;

      if (!pageToken) {
        console.log(`[IG_CONNECT] page ${rawPage.id} has IG but no page token`);
        ineligible.push({
          pageId: rawPage.id,
          pageName: rawPage.name,
          pageToken: '',
          igAccountId,
          username: null,
          tasks,
          eligibleForMessaging: false,
          diagnostic: 'instagram_link_found_but_missing_page_token',
        });
        return;
      }

      // Step 4 – resolve username (best-effort)
      let username: string | null = null;
      try {
        const igRes = await graphFetch(
          `${GRAPH_BASE}/${igAccountId}?fields=username&access_token=${pageToken}`,
        );
        username = igRes.data?.username ?? null;
      } catch {}

      // Step 5 – messaging eligibility
      const upperTasks = tasks.map((t) => t.toUpperCase());
      const eligibleForMessaging =
        upperTasks.includes('MESSAGING') || upperTasks.includes('MANAGE');

      const diagnostic: IgDiagnosticCode = eligibleForMessaging
        ? 'ok'
        : 'instagram_link_found_but_missing_messaging_task';

      const c: IgCandidate = {
        pageId: rawPage.id,
        pageName: rawPage.name,
        pageToken,
        igAccountId,
        username,
        tasks,
        eligibleForMessaging,
        diagnostic,
      };

      console.log(
        `[IG_CONNECT] page ${rawPage.id} (${rawPage.name}) → igAccount=${igAccountId} username=${username} tasks=${JSON.stringify(tasks)} eligible=${eligibleForMessaging}`,
      );

      if (eligibleForMessaging) {
        candidates.push(c);
      } else {
        ineligible.push(c);
      }
    }),
  );

  // Determine the top-level diagnostic for failure reporting
  let topDiagnostic: IgDiagnosticCode;
  if (candidates.length > 0) {
    topDiagnostic = 'ok';
  } else if (pagesWithIg > 0) {
    topDiagnostic = 'instagram_link_found_but_missing_messaging_task';
  } else if (rawPages.length > 0) {
    topDiagnostic = 'pages_found_but_no_instagram_link';
  } else {
    topDiagnostic = 'no_pages_found';
  }

  console.log(
    `[IG_CONNECT] discovery complete: pagesFound=${rawPages.length} pagesWithIg=${pagesWithIg} eligible=${candidates.length} ineligible=${ineligible.length} topDiagnostic=${topDiagnostic}`,
  );

  return {
    candidates,
    ineligible,
    topDiagnostic,
    pagesFound: rawPages.length,
    pagesWithIg,
  };
}

// ─── Facebook Messenger candidate discovery ───────────────────────────────────

export interface FbCandidate {
  pageId: string;
  pageName: string;
  /** Page-scoped access token — server-side only, never sent to browser. */
  pageToken: string;
  tasks: string[];
  eligibleForMessaging: boolean;
}

/**
 * Discover Facebook Pages eligible for Messenger integration.
 *
 * Eligibility:
 *  - Must have access_token in /me/accounts response.
 *  - tasks must include MESSAGING or MANAGE.
 */
export async function discoverFacebookCandidates(
  userToken: string,
): Promise<{
  candidates: FbCandidate[];
  ineligible: FbCandidate[];
  pagesFound: number;
}> {
  const result = await graphFetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,tasks&access_token=${userToken}`,
  );

  if (!result.ok) {
    console.error('[FB_CONNECT] graph /me/accounts failed', {
      code: result.graphError?.code,
      type: result.graphError?.type,
      message: result.graphError?.message,
    });
    return { candidates: [], ineligible: [], pagesFound: 0 };
  }

  const rawPages: Array<{ id: string; name: string; access_token?: string; tasks?: string[] }> =
    result.data?.data ?? [];

  console.log(`[FB_CONNECT] /me/accounts returned ${rawPages.length} pages`);

  const candidates: FbCandidate[] = [];
  const ineligible: FbCandidate[] = [];

  for (const page of rawPages) {
    const tasks: string[] = page.tasks ?? [];
    const upperTasks = tasks.map((t) => t.toUpperCase());
    const eligibleForMessaging =
      upperTasks.includes('MESSAGING') || upperTasks.includes('MANAGE');
    const pageToken = page.access_token ?? '';

    const c: FbCandidate = {
      pageId: page.id,
      pageName: page.name,
      pageToken,
      tasks,
      eligibleForMessaging,
    };

    console.log(
      `[FB_CONNECT] page ${page.id} (${page.name}) tasks=${JSON.stringify(tasks)} eligible=${eligibleForMessaging} hasToken=${!!pageToken}`,
    );

    if (eligibleForMessaging && pageToken) {
      candidates.push(c);
    } else {
      ineligible.push(c);
    }
  }

  console.log(
    `[FB_CONNECT] discovery complete: pagesFound=${rawPages.length} eligible=${candidates.length} ineligible=${ineligible.length}`,
  );

  return { candidates, ineligible, pagesFound: rawPages.length };
}
