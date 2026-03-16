import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { decrypt } from '@/lib/utils/crypto';

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { to, templateName, language, variables } = body;

    if (!to || !templateName || !language) {
      return NextResponse.json({ error: 'Missing required fields: to, templateName, language' }, { status: 400 });
    }

    // Get tenant WhatsApp credentials
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        whatsappToken: true,
        whatsappPhoneNumberId: true,
        whatsappPhoneId: true,
        whatsappConnection: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const rawToken = tenant.whatsappConnection?.accessToken || tenant.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const phoneId = tenant.whatsappConnection?.phoneNumberId || tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;

    if (!token || !phoneId) {
      return NextResponse.json({ error: 'WhatsApp not configured. Connect your WhatsApp Business Account first.' }, { status: 400 });
    }

    // Build the template message payload
    const templatePayload: any = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
      }
    };

    // Add variables/parameters if provided
    if (variables && variables.length > 0) {
      templatePayload.template.components = [
        {
          type: 'BODY',
          parameters: variables.map((val: string) => ({
            type: 'text',
            text: val,
          })),
        }
      ];
    }

    // Send via Meta Graph API
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatePayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Meta send error:', responseData);
      return NextResponse.json({
        success: false,
        error: responseData.error?.message || 'Failed to send template',
        details: responseData,
      }, { status: response.status });
    }

    const messageId = responseData.messages?.[0]?.id || null;
    const messageStatus = responseData.messages?.[0]?.message_status || 'accepted';

    return NextResponse.json({
      success: true,
      messageId,
      status: messageStatus,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
