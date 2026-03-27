/**
 * GET /api/catalog
 * Returns active products AND standalone services for the authenticated tenant.
 *
 * "Standalone services" = active Service records that are NOT linked to any Product
 * via Product.serviceId. These are the same items the bot lists under
 * "Serviços para Agendamento" in its catalog response, ensuring the dashboard
 * matches exactly what the bot presents.
 *
 * Source of truth:
 *   products  → Product.active = true
 *   services  → Service.active = true AND not referenced by any Product.serviceId
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [products, allServices] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: auth.tenantId, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        currency: true,
        stock: true,
        serviceId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.findMany({
      where: { tenantId: auth.tenantId, active: true },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Services already exposed via a linked Product should not appear in the
  // standalone section (the bot shows them with the product, not separately).
  const linkedServiceIds = new Set(
    products.filter((p) => p.serviceId).map((p) => p.serviceId as string)
  );
  const standaloneServices = allServices.filter((s) => !linkedServiceIds.has(s.id));

  return NextResponse.json({
    products,
    services: standaloneServices,
    total: products.length + standaloneServices.length,
  });
}
