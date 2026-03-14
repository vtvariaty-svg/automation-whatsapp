import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get tenant WhatsApp credentials
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        whatsappToken: true,
        whatsappBusinessAccountId: true,
        whatsappConnection: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const token = tenant.whatsappConnection?.accessToken || tenant.whatsappToken;
    const wabaId = tenant.whatsappConnection?.wabaId || tenant.whatsappBusinessAccountId;

    if (!token || !wabaId) {
      return NextResponse.json({ error: 'WhatsApp not configured. Connect your WhatsApp Business Account first.' }, { status: 400 });
    }

    // Fetch templates from Meta Graph API
    const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?fields=name,category,language,status,components`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Meta API error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch templates from Meta', details: errorData }, { status: response.status });
    }

    const data = await response.json();

    // Parse templates into a clean format
    const templates = (data.data || []).map((tpl: any) => {
      // Extract body text from components
      const bodyComponent = tpl.components?.find((c: any) => c.type === 'BODY');
      const bodyText = bodyComponent?.text || '';

      // Detect placeholders like {{1}}, {{2}}, etc.
      const placeholderMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
      const placeholders = [...new Set(placeholderMatches)];

      return {
        name: tpl.name,
        category: tpl.category,
        language: tpl.language,
        status: tpl.status,
        body: bodyText,
        placeholders,
      };
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
