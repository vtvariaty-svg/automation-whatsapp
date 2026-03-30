import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

// Returns candidate Facebook pages stored during a pending_selection.
// Only relevant when facebookConnection.status === 'pending_selection'.
// pageToken is NEVER returned to the browser.

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conn = await prisma.facebookConnection.findUnique({ where: { tenantId: auth.tenantId } });
  if (!conn || conn.status !== 'pending_selection' || !conn.pageId) {
    return NextResponse.json({ pages: [] });
  }

  try {
    const rawPages = JSON.parse(conn.pageId) as Array<{
      pageId: string;
      pageName: string;
      tasks: string[];
      eligibleForMessaging: boolean;
    }>;

    // Explicit strip of any accidentally stored tokens (safety net)
    const safePages = rawPages.map(({ pageId, pageName, tasks, eligibleForMessaging }) => ({
      pageId,
      pageName,
      tasks,
      eligibleForMessaging,
    }));

    return NextResponse.json({ pages: safePages });
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
