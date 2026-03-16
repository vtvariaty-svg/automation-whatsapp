import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { decrypt } from '@/lib/utils/crypto';

// Seed templates that demonstrate placeholder functionality for Meta App Review.
// These mirror real WhatsApp template structure so the send endpoint works the same way.
// IMPORTANT: These must actually exist in your WABA to send. 
// If they don't exist yet, create them in Meta Business Manager first.
const SEED_TEMPLATES = [
  {
    name: 'order_confirmation',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Hello {{1}}, your order {{2}} has been confirmed. Thank you.',
    placeholders: ['{{1}}', '{{2}}'],
    placeholderLabels: ['Customer Name', 'Order ID'],
  },
  {
    name: 'appointment_reminder',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}. Reply YES to confirm.',
    placeholders: ['{{1}}', '{{2}}', '{{3}}'],
    placeholderLabels: ['Customer Name', 'Date', 'Time'],
  },
  {
    name: 'promo_offer',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    body: 'Hey {{1}}! 🎉 We have a special offer for you: {{2}}% off on your next purchase! Use code {{3}} at checkout.',
    placeholders: ['{{1}}', '{{2}}', '{{3}}'],
    placeholderLabels: ['Customer Name', 'Discount Percentage', 'Promo Code'],
  },
];

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

    const rawToken = tenant.whatsappConnection?.accessToken || tenant.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const wabaId = tenant.whatsappConnection?.wabaId || tenant.whatsappBusinessAccountId;

    let liveTemplates: any[] = [];

    if (token && wabaId) {
      try {
        // Fetch templates from Meta Graph API
        const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?fields=name,category,language,status,components`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();

          liveTemplates = (data.data || []).map((tpl: any) => {
            // Extract body text from components
            const bodyComponent = tpl.components?.find((c: any) => c.type === 'BODY');
            const bodyText = bodyComponent?.text || '';

            // Detect placeholders like {{1}}, {{2}}, etc.
            const placeholderMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
            const placeholders = [...new Set(placeholderMatches)];

            // Try to extract example values as labels
            const examples = bodyComponent?.example?.body_text?.[0] || [];
            const placeholderLabels = placeholders.map((_: any, i: number) =>
              examples[i] ? `e.g. ${examples[i]}` : `Variable ${i + 1}`
            );

            return {
              name: tpl.name,
              category: tpl.category,
              language: tpl.language,
              status: tpl.status,
              body: bodyText,
              placeholders,
              placeholderLabels,
            };
          });
        } else {
          console.warn('Could not fetch live templates, using seed templates only');
        }
      } catch (fetchErr) {
        console.warn('Error fetching live templates:', fetchErr);
      }
    }

    // Merge: live templates first, then seed templates that don't overlap by name
    const liveNames = new Set(liveTemplates.map((t: any) => t.name));
    const seedsToAdd = SEED_TEMPLATES.filter(s => !liveNames.has(s.name));
    const allTemplates = [...liveTemplates, ...seedsToAdd];

    return NextResponse.json(allTemplates);
  } catch (error: any) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

