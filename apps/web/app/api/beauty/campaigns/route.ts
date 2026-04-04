// BW1 — Beauty campaigns API
// GET  /api/beauty/campaigns  → list active campaign rules
// POST /api/beauty/campaigns  → create a new campaign rule

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  getCampaignRules,
  createCampaignRule,
} from '@/src/services/beautyWorkspaceService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'beautyWorkspace', auth.role);
  if (!check.allowed) {
    return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  }

  const rules = await getCampaignRules(auth.tenantId);
  return NextResponse.json(rules);
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
    const { name, triggerType, messageTemplate } = body;
    if (!name || !triggerType || !messageTemplate) {
      return NextResponse.json(
        { error: 'name, triggerType, and messageTemplate are required' },
        { status: 400 }
      );
    }
    const rule = await createCampaignRule(auth.tenantId, body);
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
