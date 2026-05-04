// Clinic Appointment Requests API (admin-only — no public POST)
// GET  /api/clinic/appointment-requests  → list requests for tenant
// Supports query params: status, page, pageSize

import { NextResponse } from 'next/server';
import { requireClinicAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

const VALID_STATUS = ['NEW', 'CONTACTED', 'SCHEDULED', 'CANCELED', 'ARCHIVED'];

export async function GET(request: Request) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

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

    const [total, requests] = await Promise.all([
      prisma.appointmentRequest.count({ where }),
      prisma.appointmentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          service:      { select: { id: true, name: true } },
          professional: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: requests, total, page, pageSize });
  } catch (error: any) {
    console.error('[clinic/appointment-requests GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
