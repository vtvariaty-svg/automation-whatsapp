import { NextResponse } from 'next/server';
import { getAnalytics } from '@/src/services/analyticsService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const period = searchParams.get('period') || 'today'; // today, 7days, 30days

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const data = await getAnalytics(tenantId, period);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
