import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

/**
 * Handles the WhatsApp Embedded Signup callback.
 * Receives the code from the Facebook SDK, exchanges it for an access token,
 * then discovers the WABA ID and Phone Number ID.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, wabaId: embeddedWabaId, phoneNumberId: embeddedPhoneId } = body;

    // Get tenant from auth
    const auth = await getAuthTenant(request);
    const tenantId = body.tenantId || auth?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing code from Embedded Signup' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Facebook app not configured on server' }, { status: 500 });
    }

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
      `client_id=${appId}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData.error);
      return NextResponse.json({ 
        error: 'Failed to exchange code for token: ' + (tokenData.error?.message || 'Unknown error') 
      }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Use embedded WABA ID and Phone Number ID if provided by the SDK
    let finalWabaId = embeddedWabaId || null;
    let finalPhoneId = embeddedPhoneId || null;
    let phoneDisplay: string | null = null;

    // If not provided by SDK, try to discover via Graph API
    if (!finalWabaId || !finalPhoneId) {
      try {
        // Try shared WABA accounts first (Embedded Signup creates shared accounts)
        const sharedRes = await fetch(
          `https://graph.facebook.com/v22.0/me/businesses?access_token=${accessToken}`
        );
        const sharedData = await sharedRes.json();

        if (sharedData.data?.length > 0) {
          for (const business of sharedData.data) {
            const wabaRes = await fetch(
              `https://graph.facebook.com/v22.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
            );
            const wabaData = await wabaRes.json();

            if (wabaData.data?.length > 0) {
              finalWabaId = finalWabaId || wabaData.data[0].id;
              
              const phoneRes = await fetch(
                `https://graph.facebook.com/v22.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
              );
              const phoneData = await phoneRes.json();
              
              if (phoneData.data?.length > 0) {
                finalPhoneId = finalPhoneId || phoneData.data[0].id;
                phoneDisplay = phoneData.data[0].display_phone_number || null;
              }
              break;
            }
          }
        }

        // Direct endpoint fallback
        if (!finalWabaId) {
          const directRes = await fetch(
            `https://graph.facebook.com/v22.0/me/whatsapp_business_accounts?access_token=${accessToken}`
          );
          const directData = await directRes.json();
          
          if (directData.data?.length > 0) {
            finalWabaId = directData.data[0].id;
            const phoneRes = await fetch(
              `https://graph.facebook.com/v22.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
            );
            const phoneData = await phoneRes.json();
            if (phoneData.data?.length > 0) {
              finalPhoneId = finalPhoneId || phoneData.data[0].id;
              phoneDisplay = phoneData.data[0].display_phone_number || null;
            }
          }
        }
      } catch (graphErr: any) {
        console.error('Graph API discovery error (non-fatal):', graphErr.message);
      }
    }

    // If we have WABA ID but no phone display, fetch it
    if (finalWabaId && finalPhoneId && !phoneDisplay) {
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v22.0/${finalPhoneId}?fields=display_phone_number&access_token=${accessToken}`
        );
        const phoneData = await phoneRes.json();
        phoneDisplay = phoneData.display_phone_number || null;
      } catch {}
    }

    // Save to database
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappToken: accessToken,
        whatsappBusinessAccountId: finalWabaId,
        whatsappPhoneNumberId: finalPhoneId,
        whatsappPhoneId: finalPhoneId,
      },
    });

    return NextResponse.json({
      success: true,
      wabaId: finalWabaId,
      phoneNumberId: finalPhoneId,
      phoneDisplay,
    });
  } catch (error: any) {
    console.error('Embedded Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
