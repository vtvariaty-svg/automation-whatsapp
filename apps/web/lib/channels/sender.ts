import type { NormalizedOutboundEvent } from './types';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';

export async function sendChannelMessage(event: NormalizedOutboundEvent): Promise<void> {
  const { channel, to, text, config } = event;

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
}
