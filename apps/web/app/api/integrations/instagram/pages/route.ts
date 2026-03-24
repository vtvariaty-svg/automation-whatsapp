import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

// Returns the list of candidate pages stored during a pending Instagram selection.
// Only relevant when instagramConnection.status === 'pending_selection'.

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conn = await prisma.instagramConnection.findUnique({ where: { tenantId: auth.tenantId } });
  if (!conn || conn.status !== 'pending_selection' || !conn.pageId) {
    return NextResponse.json({ pages: [] });
  }

  try {
    const pages = JSON.parse(conn.pageId);
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
