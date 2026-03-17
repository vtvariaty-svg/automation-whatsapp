import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getOrderAnalytics } from '@/src/services/orderService';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const now = new Date();

    let startDate: Date;
    switch (period) {
      case '7days': startDate = startOfDay(subDays(now, 7)); break;
      case '30days': startDate = startOfDay(subDays(now, 30)); break;
      case 'today':
      default: startDate = startOfDay(now); break;
    }

    const data = await getOrderAnalytics(auth.tenantId, startDate);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
