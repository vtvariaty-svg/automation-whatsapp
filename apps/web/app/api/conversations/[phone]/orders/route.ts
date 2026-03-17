import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { phone } = await params;

    const orders = await prisma.order.findMany({
      where: {
        tenantId: auth.tenantId,
        customerPhone: phone,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
