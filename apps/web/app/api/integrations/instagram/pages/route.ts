import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';

// This endpoint is no longer applicable in the Instagram Login architecture.
// Instagram Login provides a 1:1 user token — there is no page selection step.
// The callback connects directly without a selector. This endpoint returns an empty
// list to prevent errors from any stale client-side references.

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ pages: [] });
}
