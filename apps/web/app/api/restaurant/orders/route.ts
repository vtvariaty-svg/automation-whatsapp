// Food Orders API (admin-only — no public POST)
// GET  /api/restaurant/orders  → list orders for tenant's restaurant
// Supports: status, page, pageSize query params

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

const VALID_STATUS = [
  'NEW', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED',
];

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')));

  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json(
      { error: `status inválido. Valores aceitos: ${VALID_STATUS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const where = {
      tenantId: auth.tenantId,
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      prisma.foodOrder.count({ where }),
      prisma.foodOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ data: orders, total, page, pageSize });
  } catch (error: any) {
    console.error('[restaurant/orders GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
