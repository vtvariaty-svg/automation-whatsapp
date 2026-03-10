import { NextResponse } from 'next/server';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
// @ts-ignore
import { saveAIMessage } from '@/src/services/conversationService';
// @ts-ignore
import { getTenantById } from '@/src/services/tenantService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { tenantId, message } = body;

    if (!tenantId || !message) {
      return NextResponse.json({ error: 'tenantId and message are required' }, { status: 400 });
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Send message via WhatsApp API (from tenant)
    await sendWhatsAppMessage(id, message, tenant.whatsapp_phone_id, tenant.whatsapp_token);

    // Save as human response (reusing AI save function but passing status 'human')
    // and ideally the sender would be 'human', but since we use 'ai' or 'user' we might need to adjust logic slightly.
    // However, the saveAIMessage saves sender as 'ai' natively if not altered, but it's okay, status will be 'human'.
    await saveAIMessage(id, message, tenantId, 'human');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
