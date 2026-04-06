import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() ?? null;

  try {
    const [products, services] = await Promise.all([
      prisma.product.findMany({
        where: {
          tenantId: auth.tenantId,
          active: true,
          ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        },
        select: {
          id: true, name: true, price: true, currency: true, category: true,
          description: true, externalSalesUrl: true, serviceId: true, salesMode: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.service.findMany({
        where: {
          tenantId: auth.tenantId,
          active: true,
          ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        },
        select: { id: true, name: true, durationMinutes: true },
        take: 15,
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        category: p.category,
        description: p.description?.slice(0, 200) ?? null,
        hasExternalUrl: p.salesMode === 'external_link' || !!p.externalSalesUrl,
        requiresService: !!p.serviceId,
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
