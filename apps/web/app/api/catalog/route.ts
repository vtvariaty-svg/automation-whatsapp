/**
 * GET /api/catalog
 * Returns active products for the authenticated tenant.
 * Used by the operational bot and future checkout flows.
 * Source of truth: Product.active = true.
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { tenantId: auth.tenantId, active: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      price: true,
      currency: true,
      stock: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ products, total: products.length });
}
