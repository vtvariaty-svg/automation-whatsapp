import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, accessToken } = body;

    if (!tenantId || !accessToken) {
      return NextResponse.json({ error: 'Missing tenantId or accessToken' }, { status: 400 });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Use the access token to fetch WhatsApp Business data from Graph API
    let wabaId: string | null = null;
    let phoneNumberId: string | null = null;
    let phoneDisplay: string | null = null;

    try {
      // Try: Get businesses owned by this user
      const businessRes = await fetch(
        `https://graph.facebook.com/v22.0/me/businesses?access_token=${accessToken}`
      );
      const businessData = await businessRes.json();
      console.log('Business data:', JSON.stringify(businessData, null, 2));

      if (businessData.data && businessData.data.length > 0) {
        // Try each business to find WhatsApp accounts
        for (const business of businessData.data) {
          const wabaRes = await fetch(
            `https://graph.facebook.com/v22.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
          );
          const wabaData = await wabaRes.json();
          console.log(`WABA data for business ${business.id}:`, JSON.stringify(wabaData, null, 2));

          if (wabaData.data && wabaData.data.length > 0) {
            wabaId = wabaData.data[0].id;

            // Get phone numbers for this WABA
            const phoneRes = await fetch(
              `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${accessToken}`
            );
            const phoneData = await phoneRes.json();
            console.log('Phone data:', JSON.stringify(phoneData, null, 2));

            if (phoneData.data && phoneData.data.length > 0) {
              phoneNumberId = phoneData.data[0].id;
              phoneDisplay = phoneData.data[0].display_phone_number || phoneData.data[0].verified_name || null;
            }
            break; // Found a WABA, stop searching
          }
        }
      }

      // Fallback: try direct endpoint
      if (!wabaId) {
        const directRes = await fetch(
          `https://graph.facebook.com/v22.0/me/whatsapp_business_accounts?access_token=${accessToken}`
        );
        const directData = await directRes.json();
        console.log('Direct WABA data:', JSON.stringify(directData, null, 2));

        if (directData.data && directData.data.length > 0) {
          wabaId = directData.data[0].id;

          const phoneRes = await fetch(
            `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${accessToken}`
          );
          const phoneData = await phoneRes.json();

          if (phoneData.data && phoneData.data.length > 0) {
            phoneNumberId = phoneData.data[0].id;
            phoneDisplay = phoneData.data[0].display_phone_number || phoneData.data[0].verified_name || null;
          }
        }
      }
    } catch (graphErr: any) {
      console.error('Error fetching WhatsApp data from Graph API:', graphErr.message);
    }

    // Save to database
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappToken: accessToken,
        whatsappBusinessAccountId: wabaId,
        whatsappPhoneNumberId: phoneNumberId,
        whatsappPhoneId: phoneNumberId,
      }
    });

    return NextResponse.json({
      success: true,
      wabaId,
      phoneNumberId,
      phoneDisplay,
    });
  } catch (error: any) {
    console.error('Error in WhatsApp OAuth callback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
