// BW1 — Beauty service profiles API
// GET  /api/beauty/services          → list services with beauty enrichment
// POST /api/beauty/services          → upsert beauty profile for a service

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  getServiceProfiles,
  upsertServiceProfile,
} from '@/src/services/beautyWorkspaceService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  const profiles = await getServiceProfiles(auth.tenantId);
  return NextResponse.json(profiles);
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
    const { serviceId, ...data } = body;
    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    }
    const profile = await upsertServiceProfile(auth.tenantId, serviceId, data);
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
