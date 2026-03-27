/**
 * GET /api/catalog
 * Returns active products AND services for the authenticated tenant.
 *
 * Services shown:
 *   - manual active services (sourceType='manual' AND active=true)
 *   - system active services seeded by the current bot
 *     (sourceType='system' AND active=true AND sourceBotKey=tenant.activeBotKey)
 *
 * "Standalone services" = services NOT linked to any Product via Product.serviceId.
 * These are the items the bot lists under "Serviços para Agendamento".
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Resolve activeBotKey to filter system services correctly
  const tenant = await (prisma.tenant as any).findUnique({
    where: { id: auth.tenantId },
    select: { activeBotKey: true },
  });
  const activeBotKey = (tenant as any)?.activeBotKey as string | null ?? null;

  // Build OR clause for service visibility
  const serviceOrClauses: any[] = [
    { sourceType: 'manual', active: true },
  ];
  if (activeBotKey) {
    serviceOrClauses.push({ sourceType: 'system', active: true, sourceBotKey: activeBotKey });
  }

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
    (prisma.service as any).findMany({
      where: {
        tenantId: auth.tenantId,
        OR: serviceOrClauses,
      },
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
  const standaloneServices = (allServices as any[]).filter((s: any) => !linkedServiceIds.has(s.id));

  return NextResponse.json({
    products,
    services: standaloneServices,
    total: products.length + standaloneServices.length,
  });
}
