import { NextResponse } from 'next/server';
import { getSalesAnalytics } from '@/src/services/salesAnalyticsService';
import { checkFeature } from '@/lib/services/entitlementsService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const period = searchParams.get('period') || 'today';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const check = await checkFeature(tenantId, 'advancedAnalytics');
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

  try {
    const data = await getSalesAnalytics(tenantId, period);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
