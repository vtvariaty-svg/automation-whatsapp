/**
 * POST /api/agent/actions/prepare-schedule
 *
 * Checks whether scheduling is viable for a given service.
 * Does NOT create appointments — returns parameters for the deterministic booking flow.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { serviceId, serviceName } = body ?? {};

  try {
    // Check if tenant has scheduling enabled (at least one service exists)
    const totalServices = await prisma.service.count({
      where: { tenantId: auth.tenantId, active: true },
    });

    if (totalServices === 0) {
      return NextResponse.json({
        serviceFound: false,
        serviceId: null,
        serviceName: null,
        hasAvailability: false,
        schedulingEnabled: false,
      });
    }

    // Find the specific service if requested
    let service = null;
    if (serviceId) {
      service = await prisma.service.findFirst({
        where: { id: serviceId, tenantId: auth.tenantId, active: true },
        select: { id: true, name: true, durationMinutes: true },
      });
    } else if (serviceName) {
      service = await prisma.service.findFirst({
        where: {
          tenantId: auth.tenantId,
          active: true,
          name: { contains: serviceName, mode: 'insensitive' },
        },
        select: { id: true, name: true, durationMinutes: true },
      });
    }

    // Check tenant has business config for scheduling
    const businessConfig = await prisma.businessConfig.findUnique({
      where: { tenantId: auth.tenantId },
      select: { openingHours: true },
    });

    return NextResponse.json({
      serviceFound: !!service,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? null,
      durationMinutes: service?.durationMinutes ?? null,
      hasAvailability: !!businessConfig?.openingHours,
      schedulingEnabled: true,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
