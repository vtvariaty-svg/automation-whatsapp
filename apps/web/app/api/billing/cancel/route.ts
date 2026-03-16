import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const reason: string = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 },
      );
    }

    // Update the subscription — in production this would also cancel on Stripe
    await prisma.subscription.updateMany({
      where: { tenantId: auth.tenantId },
      data: {
        churnReason: reason,
        status: 'canceled',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
