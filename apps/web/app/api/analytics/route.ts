import { NextResponse } from 'next/server';
import { getAnalytics } from '@/src/services/analyticsService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today'; // today, 7days, 30days

  try {
    const data = await getAnalytics(auth.tenantId, period);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
