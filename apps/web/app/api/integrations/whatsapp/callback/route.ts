import { NextResponse } from 'next/server';
// @ts-ignore
import { updateTenantWhatsAppCredentials, getTenantById } from '@/src/services/tenantService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, business_account_id, phone_number_id, access_token } = body;

    if (!tenantId || !business_account_id || !phone_number_id || !access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify tenant exists
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Update settings in database
    const updatedTenant = await updateTenantWhatsAppCredentials(tenantId, {
      business_account_id,
      phone_number_id,
      access_token
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error: any) {
    console.error('Error saving WhatsApp credentials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
