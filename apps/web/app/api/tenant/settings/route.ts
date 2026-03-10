import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { getTenantById, updateTenantAISettings } from '@/src/services/tenantService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, ai_prompt, welcome_message, business_hours } = body;
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const updated = await updateTenantAISettings(tenantId, { ai_prompt, welcome_message, business_hours });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
