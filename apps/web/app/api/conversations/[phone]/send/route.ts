import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/utils/crypto';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
// @ts-ignore
import { saveAIMessage } from '@/src/services/conversationService';
// @ts-ignore
import { getTenantById } from '@/src/services/tenantService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone } = await params;
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const tenant = await getTenantById(auth.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const sendPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
    const sendToken = tenant.whatsappToken ? decrypt(tenant.whatsappToken) : null;

    // Send message via WhatsApp API (from tenant)
    await sendWhatsAppMessage(phone, message, sendPhoneId, sendToken);

    // Save as human response (aiGenerated = false)
    await saveAIMessage(phone, message, auth.tenantId, 'human', false);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
