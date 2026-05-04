import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { encrypt } from '@/lib/utils/crypto';
import { isChannelItemAccessible, channelBlockedResponse } from '@/lib/auth/moduleGuard';

/**
 * Handles the WhatsApp Embedded Signup callback.
 * Receives the code from the Facebook SDK, exchanges it for an access token,
 * then discovers the WABA ID and Phone Number ID.
 */
export async function POST(request: Request) {
  try {
    if (!(await isChannelItemAccessible('whatsapp'))) return channelBlockedResponse('whatsapp');

    const body = await request.json();
    const { code, wabaId: embeddedWabaId, phoneNumberId: embeddedPhoneId, isCoexistence } = body;

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
    // The redirect_uri must match what the JS SDK used (the page origin)
    const redirectUri = body.redirectUri || '';
    
    const tokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);
    if (redirectUri) {
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
    }
    
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    
    console.log('Token exchange response:', JSON.stringify(tokenData).slice(0, 200));

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

    // Auto-discover WABA ID and Phone Number ID via Graph API
    if (!finalWabaId || !finalPhoneId) {
      console.log('[whatsapp_discovery_start] Starting auto-discovery for tenant:', tenantId);

      try {
        // === ATTEMPT 1: GET /me?fields=whatsapp_business_account (preferred) ===
        if (!finalWabaId) {
          console.log('[whatsapp_discovery] Trying GET /me?fields=whatsapp_business_account');
          const meRes = await fetch(
            `https://graph.facebook.com/v22.0/me?fields=whatsapp_business_account&access_token=${accessToken}`
          );
          const meData = await meRes.json();
          console.log('[whatsapp_discovery] /me response:', JSON.stringify(meData).slice(0, 300));

          if (meData.whatsapp_business_account?.id) {
            finalWabaId = meData.whatsapp_business_account.id;
            console.log('[whatsapp_discovery] Found WABA ID via /me:', finalWabaId);
          }
        }

        // === ATTEMPT 2: GET /debug_token to find WABA from token granular scopes ===
        if (!finalWabaId && appId && appSecret) {
          console.log('[whatsapp_discovery] Trying GET /debug_token');
          const debugRes = await fetch(
            `https://graph.facebook.com/v22.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
          );
          const debugData = await debugRes.json();
          console.log('[whatsapp_discovery] debug_token response:', JSON.stringify(debugData).slice(0, 500));

          const granularScopes = debugData.data?.granular_scopes || [];
          for (const scope of granularScopes) {
            if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length > 0) {
              finalWabaId = scope.target_ids[0];
              console.log('[whatsapp_discovery] Found WABA ID via debug_token:', finalWabaId);
              break;
            }
          }
        }

        // === ATTEMPT 3: GET /me/businesses fallback ===
        if (!finalWabaId) {
          console.log('[whatsapp_discovery] Trying GET /me/businesses fallback');
          const businessRes = await fetch(
            `https://graph.facebook.com/v22.0/me/businesses?access_token=${accessToken}`
          );
          const businessData = await businessRes.json();

          if (businessData.data?.length > 0) {
            for (const business of businessData.data) {
              const wabaRes = await fetch(
                `https://graph.facebook.com/v22.0/${business.id}/owned_whatsapp_business_accounts?access_token=${accessToken}`
              );
              const wabaData = await wabaRes.json();
              if (wabaData.data?.length > 0) {
                finalWabaId = wabaData.data[0].id;
                console.log('[whatsapp_discovery] Found WABA ID via businesses fallback:', finalWabaId);
                break;
              }
            }
          }
        }

        // === DISCOVER PHONE NUMBER ID from WABA ===
        if (finalWabaId && !finalPhoneId) {
          console.log('[whatsapp_discovery] Fetching phone numbers for WABA:', finalWabaId);
          const phoneRes = await fetch(
            `https://graph.facebook.com/v22.0/${finalWabaId}/phone_numbers?access_token=${accessToken}`
          );
          const phoneData = await phoneRes.json();
          console.log('[whatsapp_discovery] phone_numbers response:', JSON.stringify(phoneData).slice(0, 300));

          if (phoneData.data?.length > 0) {
            finalPhoneId = phoneData.data[0].id;
            phoneDisplay = phoneData.data[0].display_phone_number || null;
            console.log('[whatsapp_discovery] Found Phone ID:', finalPhoneId, 'Display:', phoneDisplay);
          }
        }

        // === Fetch display phone if missing ===
        if (finalPhoneId && !phoneDisplay) {
          try {
            const dpRes = await fetch(
              `https://graph.facebook.com/v22.0/${finalPhoneId}?fields=display_phone_number&access_token=${accessToken}`
            );
            const dpData = await dpRes.json();
            phoneDisplay = dpData.display_phone_number || null;
          } catch {}
        }

        if (finalWabaId && finalPhoneId) {
          console.log('[whatsapp_discovery_success] WABA:', finalWabaId, 'Phone:', finalPhoneId, 'Display:', phoneDisplay);
        } else {
          console.log('[whatsapp_discovery_failed] Could not auto-discover. WABA:', finalWabaId, 'Phone:', finalPhoneId);
        }
      } catch (graphErr: any) {
        console.error('[whatsapp_discovery_failed] Exception:', graphErr.message);
      }
    }

    // Save to Database (Tenant for fallback webhook support)
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappToken: encrypt(accessToken),
        whatsappBusinessAccountId: finalWabaId,
        whatsappPhoneNumberId: finalPhoneId,
        whatsappPhoneId: finalPhoneId,
      },
    });

    // Save to new WhatsAppConnection model
    if (accessToken) {
      await prisma.whatsAppConnection.upsert({
        where: { tenantId },
        create: {
          tenantId,
          wabaId: finalWabaId,
          phoneNumberId: finalPhoneId,
          displayPhone: phoneDisplay,
          accessToken: encrypt(accessToken),
          status: 'connected',
        },
        update: {
          wabaId: finalWabaId,
          phoneNumberId: finalPhoneId,
          displayPhone: phoneDisplay,
          accessToken: encrypt(accessToken),
          status: 'connected',
        },
      });
    }

    // Auto-subscribe the webhook so the user doesn't have to do it manually in the Meta App Dashboard
    if (finalWabaId && accessToken) {
      try {
        console.log(`Auto-subscribing Meta App webhook for WABA ID: ${finalWabaId}`);
        const subscribeRes = await fetch(
          `https://graph.facebook.com/v22.0/${finalWabaId}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const subscribeData = await subscribeRes.json();
        if (!subscribeRes.ok || !subscribeData.success) {
          console.warn('Non-fatal: Could not auto-subscribe webhook:', subscribeData);
        } else {
          console.log('Successfully subscribed webhook:', subscribeData);
        }
      } catch (subErr: any) {
        console.warn('Non-fatal error auto-subscribing webhook:', subErr.message);
      }
    }

    // Coexistência: sincronizar contatos e histórico de mensagens do app
    if (isCoexistence && finalPhoneId && accessToken) {
      console.log('[coexistence] Iniciando sincronização de contatos e histórico...');
      try {
        const syncHeaders = {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        };

        // Sincronizar contatos (só pode ser feito uma vez por integração)
        const contactsRes = await fetch(
          `https://graph.facebook.com/v22.0/${finalPhoneId}/smb_app_data`,
          {
            method: 'POST',
            headers: syncHeaders,
            body: JSON.stringify({ messaging_product: 'whatsapp', sync_type: 'smb_app_state_sync' }),
          }
        );
        const contactsData = await contactsRes.json();
        console.log('[coexistence] Sync contatos:', JSON.stringify(contactsData).slice(0, 200));

        // Sincronizar histórico de mensagens (até 6 meses, se cliente permitiu)
        const historyRes = await fetch(
          `https://graph.facebook.com/v22.0/${finalPhoneId}/smb_app_data`,
          {
            method: 'POST',
            headers: syncHeaders,
            body: JSON.stringify({ messaging_product: 'whatsapp', sync_type: 'history' }),
          }
        );
        const historyData = await historyRes.json();
        console.log('[coexistence] Sync histórico:', JSON.stringify(historyData).slice(0, 200));
      } catch (coexErr: any) {
        console.warn('[coexistence] Erro não-fatal ao sincronizar dados:', coexErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      wabaId: finalWabaId,
      phoneNumberId: finalPhoneId,
      phoneDisplay,
      isCoexistence: !!isCoexistence,
    });
  } catch (error: any) {
    console.error('Embedded Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
