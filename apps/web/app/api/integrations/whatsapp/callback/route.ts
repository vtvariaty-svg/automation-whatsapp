import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, wabaId, phoneNumberId } = body;

    // Get tenantId from request body OR from auth
    let tenantId = body.tenantId;
    if (!tenantId) {
      const auth = await getAuthTenant(request);
      if (auth) tenantId = auth.tenantId;
    }

    if (!tenantId || (!accessToken && !wabaId && !phoneNumberId)) {
      return NextResponse.json({ error: 'Missing tenantId or data' }, { status: 400 });
    }

    // If token is __KEEP_EXISTING__, skip token-related logic and just update IDs
    const isIdOnlyUpdate = accessToken === '__KEEP_EXISTING__';

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // If manual wabaId/phoneNumberId provided, use them directly
    let finalWabaId = wabaId || null;
    let finalPhoneId = phoneNumberId || null;
    let phoneDisplay: string | null = null;

    // If not provided manually, try to discover via Graph API
    if (!finalWabaId || !finalPhoneId) {
      try {
        // Try: Get businesses
        const businessRes = await fetch(
          `https://graph.facebook.com/v22.0/me/businesses?access_token=${accessToken}`
        );
        const businessData = await businessRes.json();

        if (businessData.data && businessData.data.length > 0) {
          for (const business of businessData.data) {
            const wabaRes = await fetch(
              `https://graph.facebook.com/v22.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
            );
            const wabaData = await wabaRes.json();

            if (wabaData.data && wabaData.data.length > 0) {
              finalWabaId = finalWabaId || wabaData.data[0].id;

              const phoneRes = await fetch(
                `https://graph.facebook.com/v22.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
              );
              const phoneData = await phoneRes.json();

              if (phoneData.data && phoneData.data.length > 0) {
                finalPhoneId = finalPhoneId || phoneData.data[0].id;
                phoneDisplay = phoneData.data[0].display_phone_number || null;
              }
              break;
            }
          }
        }

        // Fallback: direct endpoint
        if (!finalWabaId) {
          const directRes = await fetch(
            `https://graph.facebook.com/v22.0/me/whatsapp_business_accounts?access_token=${accessToken}`
          );
          const directData = await directRes.json();

          if (directData.data && directData.data.length > 0) {
            finalWabaId = directData.data[0].id;
            const phoneRes = await fetch(
              `https://graph.facebook.com/v22.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
            );
            const phoneData = await phoneRes.json();
            if (phoneData.data && phoneData.data.length > 0) {
              finalPhoneId = finalPhoneId || phoneData.data[0].id;
              phoneDisplay = phoneData.data[0].display_phone_number || null;
            }
          }
        }
      } catch (graphErr: any) {
        console.error('Graph API discovery error (non-fatal):', graphErr.message);
      }
    }

    // Save to database
    const updateData: any = {};
    if (!isIdOnlyUpdate && accessToken) updateData.whatsappToken = accessToken;
    if (finalWabaId) {
      updateData.whatsappBusinessAccountId = finalWabaId;
    }
    if (finalPhoneId) {
      updateData.whatsappPhoneNumberId = finalPhoneId;
      updateData.whatsappPhoneId = finalPhoneId;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      wabaId: finalWabaId,
      phoneNumberId: finalPhoneId,
      phoneDisplay,
      autoDetected: !wabaId && !phoneNumberId && !!finalWabaId,
    });
  } catch (error: any) {
    console.error('Error in WhatsApp callback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
