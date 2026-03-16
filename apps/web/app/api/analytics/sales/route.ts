import { NextResponse } from 'next/server';
import { getSalesAnalytics } from '@/src/services/salesAnalyticsService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const period = searchParams.get('period') || 'today';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const data = await getSalesAnalytics(tenantId, period);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
