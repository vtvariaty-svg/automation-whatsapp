import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/utils/crypto';
import { prisma } from '@/lib/prisma';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
// @ts-ignore
import { saveAIMessage } from '@/src/services/conversationService';
// @ts-ignore
import { getTenantById } from '@/src/services/tenantService';
import { getAuthTenant } from '@/lib/getAuthTenant';

// WhatsApp customer-service session window: 24 hours from last inbound message
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

    // ── Session gate: WhatsApp 24h customer-service window ─────────────────
    // Find the conversation for this phone under this tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        tenantId: auth.tenantId,
        customerPhone: phone,
        status: { not: 'closed' },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (conversation) {
      // Look for any inbound message from the contact within the last 24h
      const windowStart = new Date(Date.now() - SESSION_WINDOW_MS);
      const recentInbound = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          direction: 'inbound',
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!recentInbound) {
        // No inbound message in last 24h — session is closed for this contact
        return NextResponse.json(
          {
            requiresTemplate: true,
            error:
              'Esse contato precisa receber um template aprovado da Meta para iniciar a conversa. A janela de atendimento do WhatsApp está encerrada.',
          },
          { status: 403 }
        );
      }
    } else {
      // No active conversation found at all — this is a cold/new outbound contact
      return NextResponse.json(
        {
          requiresTemplate: true,
          error:
            'Esse contato precisa receber um template aprovado da Meta para iniciar a conversa.',
        },
        { status: 403 }
      );
    }
    // ── End session gate ───────────────────────────────────────────────────

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
