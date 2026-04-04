// BW1 — Beauty customer profiles API
// GET   /api/beauty/customers?contactId=  → get customer beauty profile
// PATCH /api/beauty/customers             → update customer profile

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  getOrCreateCustomerProfile,
  updateCustomerProfile,
  getInactiveCustomers,
} from '@/src/services/beautyWorkspaceService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');
  const inactive = searchParams.get('inactive');

  if (inactive) {
    const inactivityDays = Number(searchParams.get('days') ?? '30');
    const cooldownDays = Number(searchParams.get('cooldown') ?? '7');
    const customers = await getInactiveCustomers(auth.tenantId, inactivityDays, cooldownDays);
    return NextResponse.json(customers);
  }

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  const profile = await getOrCreateCustomerProfile(auth.tenantId, contactId);
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contactId, ...data } = body;
    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }
    const profile = await updateCustomerProfile(auth.tenantId, contactId, data);
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
