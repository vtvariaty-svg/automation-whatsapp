// BW1 — Beauty Workspace configuration API
// GET  /api/beauty/workspace  → workspace config for tenant
// POST /api/beauty/workspace  → activate / update workspace config

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  getWorkspaceConfig,
  activateWorkspace,
  updateWorkspaceConfig,
} from '@/src/services/beautyWorkspaceService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  const config = await getWorkspaceConfig(auth.tenantId);
  return NextResponse.json(config ?? { status: 'not_activated' });
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
    const {
      businessSubtype,
      depositRequired,
      defaultDepositPercent,
      reengagementDays,
      confirmationLeadHours,
      reminderLeadHours,
    } = body;

    const config = await activateWorkspace(auth.tenantId, {
      businessSubtype,
      depositRequired,
      defaultDepositPercent,
      reengagementDays,
      confirmationLeadHours,
      reminderLeadHours,
    });
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
    const config = await updateWorkspaceConfig(auth.tenantId, body);
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
