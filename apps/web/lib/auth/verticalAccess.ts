/**
 * Plan-level access guards for vertical private APIs.
 *
 * Usage:
 *   const auth = await requireClinicAccess(request);
 *   if (!auth.ok) return auth.response;
 *   // auth.tenantId, auth.userId, auth.role are available
 *
 * Returns 401 if not authenticated, 403 if authenticated but wrong plan.
 * Superadmin (role === 'superadmin') always passes.
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { isSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

type VerticalAccessSuccess = {
  ok: true;
  tenantId: string;
  userId: string;
  role: string;
};

type VerticalAccessFailure = {
  ok: false;
  response: NextResponse;
};

export type VerticalAccessResult = VerticalAccessSuccess | VerticalAccessFailure;

async function checkVerticalAccess(
  request: Request,
  requiredPlan: string,
): Promise<VerticalAccessResult> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (isSuperAdmin(auth.role)) {
    return { ok: true, tenantId: auth.tenantId, userId: auth.userId, role: auth.role };
  }

  const sub = await prisma.subscription.findUnique({
    where: { tenantId: auth.tenantId },
    select: { plan: true },
  });

  if (sub?.plan !== requiredPlan) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Este recurso exige o plano ${requiredPlan}.` },
        { status: 403 },
      ),
    };
  }

  return { ok: true, tenantId: auth.tenantId, userId: auth.userId, role: auth.role };
}

export function requireClinicAccess(request: Request): Promise<VerticalAccessResult> {
  return checkVerticalAccess(request, 'consultorio');
}

export function requireRestaurantAccess(request: Request): Promise<VerticalAccessResult> {
  return checkVerticalAccess(request, 'restaurante');
}
