// BW1 — Beauty packages API
// GET  /api/beauty/packages  → list packages for tenant
// POST /api/beauty/packages  → create a new package

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  getPackages,
  createPackage,
  assignPackageToCustomer,
  redeemPackageSession,
} from '@/src/services/beautyWorkspaceService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  const packages = await getPackages(auth.tenantId);
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'assign') {
      // Assign package to customer: { action: 'assign', contactId, packageId }
      const { contactId, packageId } = data;
      if (!contactId || !packageId) {
        return NextResponse.json({ error: 'contactId and packageId are required' }, { status: 400 });
      }
      const assignment = await assignPackageToCustomer(auth.tenantId, contactId, packageId);
      return NextResponse.json(assignment);
    }

    if (action === 'redeem') {
      // Redeem a session: { action: 'redeem', customerPkgId, appointmentId? }
      const { customerPkgId, appointmentId } = data;
      if (!customerPkgId) {
        return NextResponse.json({ error: 'customerPkgId is required' }, { status: 400 });
      }
      const usage = await redeemPackageSession(customerPkgId, auth.tenantId, appointmentId);
      return NextResponse.json(usage);
    }

    // Default: create new package definition
    const { name, totalSessions, priceTotal, items } = data;
    if (!name || !totalSessions || !priceTotal || !items?.length) {
      return NextResponse.json(
        { error: 'name, totalSessions, priceTotal, and items are required' },
        { status: 400 }
      );
    }
    const pkg = await createPackage(auth.tenantId, data);
    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
