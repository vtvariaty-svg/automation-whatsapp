import { NextResponse } from 'next/server';
import { getPlanUsage } from '@/src/services/billingService';
import { getAuthUser } from '@/lib/auth-api';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  // SUPERADMIN: bypass — retorna uso ilimitado sem consultar billing real
  const user = await getAuthUser(request);
  if (user && isSuperAdmin(user.role)) {
    logSuperAdminAction(user.userId, 'view_plan_usage', tenantId);
    return NextResponse.json({
      plan_name: 'Superadmin',
      limit: -1,
      usage: 0,
      remaining: -1,
    });
  }

  try {
    const data = await getPlanUsage(tenantId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
