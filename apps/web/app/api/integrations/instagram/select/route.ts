import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';

// This endpoint is no longer applicable in the Instagram Login architecture.
// Instagram Login provides a 1:1 user token — there is no page selection step.
// The callback connects directly without a selector.

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'not_applicable' }, { status: 400 });
}
