import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    // Get the authorization code and state from Facebook redirect
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
    const redirectPage = `${baseUrl}/dashboard/integrations`;

    // Handle if user cancelled or Facebook returned an error
    if (errorParam) {
      console.error('Facebook OAuth error:', errorParam, url.searchParams.get('error_description'));
      return NextResponse.redirect(`${redirectPage}?error=oauth_cancelled`);
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${redirectPage}?error=missing_params`);
    }

    // Decode state to get tenantId
    let tenantId: string;
    try {
      const stateJson = Buffer.from(decodeURIComponent(stateParam), 'base64').toString('utf-8');
      const state = JSON.parse(stateJson);
      tenantId = state.tenantId;
    } catch {
      return NextResponse.redirect(`${redirectPage}?error=invalid_state`);
    }

    if (!tenantId) {
      return NextResponse.redirect(`${redirectPage}?error=missing_tenant`);
    }

    const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
    const fbAppSecret = process.env.FB_APP_SECRET;
    const redirectUri = `${baseUrl}/api/integrations/whatsapp/callback`;

    if (!fbAppId || !fbAppSecret) {
      console.error('Missing FB_APP_ID or FB_APP_SECRET');
      return NextResponse.redirect(`${redirectPage}?error=server_config`);
    }

    // Step 1: Exchange code for short-lived access token
    const tokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', fbAppId);
    tokenUrl.searchParams.set('client_secret', fbAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error exchanging code for token:', tokenData.error);
      return NextResponse.redirect(`${redirectPage}?error=token_exchange`);
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token
    const longTokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token');
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longTokenUrl.searchParams.set('client_id', fbAppId);
    longTokenUrl.searchParams.set('client_secret', fbAppSecret);
    longTokenUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const longTokenResponse = await fetch(longTokenUrl.toString());
    const longTokenData = await longTokenResponse.json();

    const accessToken = longTokenData.access_token || shortLivedToken;

    // Step 3: Get the user's WhatsApp Business Accounts via shared WABAs endpoint
    let wabaId: string | null = null;
    let phoneNumberId: string | null = null;
    let phoneDisplay: string | null = null;

    try {
      // Try to get shared WABA IDs (this works for Business Integration system users)
      const sharedWabaRes = await fetch(
        `https://graph.facebook.com/v22.0/debug_token?input_token=${accessToken}`,
        { headers: { Authorization: `Bearer ${fbAppId}|${fbAppSecret}` } }
      );
      const debugData = await sharedWabaRes.json();
      console.log('Debug token data:', JSON.stringify(debugData, null, 2));

      // Try fetching WABAs from business endpoint
      const businessRes = await fetch(
        `https://graph.facebook.com/v22.0/me/businesses?access_token=${accessToken}`
      );
      const businessData = await businessRes.json();
      console.log('Business data:', JSON.stringify(businessData, null, 2));

      if (businessData.data && businessData.data.length > 0) {
        const businessId = businessData.data[0].id;

        // Get WhatsApp Business Accounts owned by this business
        const wabaRes = await fetch(
          `https://graph.facebook.com/v22.0/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`
        );
        const wabaData = await wabaRes.json();
        console.log('WABA data:', JSON.stringify(wabaData, null, 2));

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
            phoneDisplay = phoneData.data[0].display_phone_number || phoneData.data[0].verified_name;
          }
        }
      }

      // Fallback: try direct WABA search if business endpoint didn't work
      if (!wabaId) {
        const directWabaRes = await fetch(
          `https://graph.facebook.com/v22.0/me/whatsapp_business_accounts?access_token=${accessToken}`
        );
        const directWabaData = await directWabaRes.json();
        console.log('Direct WABA data:', JSON.stringify(directWabaData, null, 2));

        if (directWabaData.data && directWabaData.data.length > 0) {
          wabaId = directWabaData.data[0].id;

          const phoneRes = await fetch(
            `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${accessToken}`
          );
          const phoneData = await phoneRes.json();

          if (phoneData.data && phoneData.data.length > 0) {
            phoneNumberId = phoneData.data[0].id;
            phoneDisplay = phoneData.data[0].display_phone_number || phoneData.data[0].verified_name;
          }
        }
      }
    } catch (graphErr: any) {
      console.error('Error fetching WhatsApp data from Graph API:', graphErr.message);
    }

    // Step 4: Save to database
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappToken: accessToken,
        whatsappBusinessAccountId: wabaId,
        whatsappPhoneNumberId: phoneNumberId,
        whatsappPhoneId: phoneNumberId, // keep both fields in sync
      }
    });

    // Redirect back to integrations page with success
    const successUrl = new URL(redirectPage);
    successUrl.searchParams.set('success', 'true');
    if (phoneDisplay) {
      successUrl.searchParams.set('phone', phoneDisplay);
    }
    if (wabaId) {
      successUrl.searchParams.set('waba', wabaId);
    }

    return NextResponse.redirect(successUrl.toString());
  } catch (error: any) {
    console.error('Error in WhatsApp OAuth callback:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=server_error`);
  }
}
