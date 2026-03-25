import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { getTenantById, updateTenantAISettings } from '@/src/services/tenantService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = await getTenantById(auth.tenantId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { ai_prompt, welcome_message, business_hours } = body;

    const updated = await updateTenantAISettings(auth.tenantId, { ai_prompt, welcome_message, business_hours });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
