import crypto from 'crypto';

interface MetaCapiEventOpts {
  email: string;
  eventId: string;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Normalizes and hashes a field according to Meta's instructions
 * (Lowercase, trim, SHA256 hex string).
 */
function hashData(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Dispatches a 'Lead' event to the Meta Conversions API.
 * This function should NOT block the main registration flow, so any errors are caught and logged.
 */
export async function sendLeadEventToMetaCapi(opts: MetaCapiEventOpts): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Skipping Lead event because META_PIXEL_ID or META_ACCESS_TOKEN is missing configured.');
    return;
  }

  const { email, eventId, clientIp, userAgent } = opts;

  // Build user_data per Meta Conversions API rules
  const userData: Record<string, any> = {
    em: [hashData(email)], // Meta expects arrays for most fields but accepts single values; array is safer
  };

  if (clientIp) {
    userData.client_ip_address = clientIp;
  }
  if (userAgent) {
    userData.client_user_agent = userAgent;
  }

  const payload: any = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        action_source: 'website',
        event_id: eventId, // Deduplication key that must match the browser Pixel eventID
        user_data: userData,
        custom_data: {
          currency: 'BRL',
          value: 0.0, // A lead doesn't intrinsically have a transacted value
        },
      },
    ],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        access_token: accessToken,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] Failed to dispatch Lead event:', result);
    } else {
      console.log(`[Meta CAPI] Lead event successfully dispatched. (eventId: ${eventId})`);
    }
  } catch (error) {
    // Non-blocking catch to ensure we don't crash the request
    console.error('[Meta CAPI] Error dispatching Lead event:', (error as Error).message);
  }
}
