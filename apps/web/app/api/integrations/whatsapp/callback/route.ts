import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { encrypt } from '@/lib/utils/crypto';
import { checkFeature } from '@/lib/services/entitlementsService';
import { isChannelItemAccessible, channelBlockedResponse } from '@/lib/auth/moduleGuard';

export async function POST(request: Request) {
  try {
    if (!(await isChannelItemAccessible('whatsapp'))) return channelBlockedResponse('whatsapp');

    const body = await request.json();
    const { accessToken, wabaId, phoneNumberId } = body;

    // Get tenantId from request body OR from auth
    let tenantId = body.tenantId;
    let role: string | undefined;
    if (!tenantId) {
      const auth = await getAuthTenant(request);
      if (auth) { tenantId = auth.tenantId; role = auth.role; }
    }

    if (!tenantId || (!accessToken && !wabaId && !phoneNumberId)) {
      return NextResponse.json({ error: 'Missing tenantId or data' }, { status: 400 });
    }

    // Plan enforcement: WhatsApp is only available on Standard, Pro, and Business plans
    const whatsappCheck = await checkFeature(tenantId, 'whatsapp', role);
    if (!whatsappCheck.allowed) {
      return NextResponse.json(
        { error: whatsappCheck.upgradeMessage || 'WhatsApp not available on your current plan.' },
        { status: 403 }
      );
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

    // Auto-discover WABA ID and Phone Number ID via Graph API
    if ((!finalWabaId || !finalPhoneId) && accessToken && !isIdOnlyUpdate) {
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
        if (!finalWabaId) {
          console.log('[whatsapp_discovery] Trying GET /debug_token');
          const appId = process.env.NEXT_PUBLIC_FB_APP_ID;
          const appSecret = process.env.FB_APP_SECRET;
          if (appId && appSecret) {
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
        }

        // === ATTEMPT 3: GET /me/businesses → owned_whatsapp_business_accounts (fallback) ===
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

        // === Fetch display phone if we have phoneId but no display ===
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

    // Save to database
    const updateData: any = {};
    if (!isIdOnlyUpdate && accessToken) updateData.whatsappToken = encrypt(accessToken);
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

    // Upsert into WhatsAppConnection model
    if (!isIdOnlyUpdate && accessToken) {
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
    } else if (finalWabaId || finalPhoneId) {
      // If we're only updating IDs (isIdOnlyUpdate)
      await prisma.whatsAppConnection.updateMany({
        where: { tenantId },
        data: {
          ...(finalWabaId && { wabaId: finalWabaId }),
          ...(finalPhoneId && { phoneNumberId: finalPhoneId }),
          ...(phoneDisplay && { displayPhone: phoneDisplay }),
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
