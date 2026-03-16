import type { NormalizedOutboundEvent } from './types';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
import { withRetry } from '@/lib/resilience/retry';
import { pushDeadLetter } from '@/lib/resilience/deadLetter';
import { isCircuitOpen, recordFailure, recordSuccess } from '@/lib/resilience/circuitBreaker';

/**
 * L4 – Sends a channel message with:
 *   • Circuit breaker (reject if tenant:channel is OPEN)
 *   • Retry with exponential backoff (3 attempts)
 *   • Dead-letter persistence on final failure
 */
export async function sendChannelMessage(
  event: NormalizedOutboundEvent,
  tenantId?: string,
): Promise<void> {
  const { channel, to, text, config } = event;
  const tid = tenantId ?? 'unknown';

  // Circuit breaker check
  if (isCircuitOpen(tid, channel)) {
    const msg = `[CircuitBreaker] Channel ${channel} is OPEN for tenant ${tid} — message not sent`;
    console.error(msg);
    await pushDeadLetter(
      { event: 'send_message', channel, tenantId: tid, to, text: text ?? '' },
      'circuit_open',
    );
    return;
  }

  try {
    await withRetry(async () => {
      if (channel === 'whatsapp') {
        await sendWhatsAppMessage(to, text, config.phoneId, config.token);
        return;
      }
      if (channel === 'instagram') {
        const { sendInstagramMessage } = await import('@/src/services/instagramService');
        await sendInstagramMessage(to, text, config.pageId!, config.token);
        return;
      }
      if (channel === 'facebook') {
        const { sendFacebookMessage } = await import('@/src/services/facebookService');
        await sendFacebookMessage(to, text, config.pageId!, config.token);
        return;
      }
      throw new Error(`[Channel] sendChannelMessage: channel "${channel}" not implemented`);
    });

    recordSuccess(tid, channel);
  } catch (err: any) {
    recordFailure(tid, channel);
    await pushDeadLetter(
      { event: 'send_message', channel, tenantId: tid, to, text: text ?? '' },
      err?.message ?? String(err),
      3,
    );
    throw err;
  }
}
