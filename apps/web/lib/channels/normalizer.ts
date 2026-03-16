import type { Channel, NormalizedInboundEvent } from './types';

export function detectChannel(body: any): Channel | null {
  if (body?.object === 'whatsapp_business_account') return 'whatsapp';
  if (body?.object === 'instagram') return 'instagram';
  if (body?.object === 'page') return 'facebook';
  return null;
}

export function normalizeWhatsAppInbound(body: any): NormalizedInboundEvent | null {
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (!value?.metadata) return null;
    const message = value.messages?.[0];
    if (!message) return null;
    return {
      channel: 'whatsapp',
      accountId: value.metadata.phone_number_id,
      from: message.from,
      messageId: message.id,
      text: message.text?.body ?? null,
      timestamp: message.timestamp ? Number(message.timestamp) * 1000 : Date.now(),
      raw: body,
    };
  } catch {
    return null;
  }
}

export function normalizeInstagramDMInbound(body: any): NormalizedInboundEvent | null {
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message) return null;
    return {
      channel: 'instagram',
      accountId: entry.id,
      from: messaging.sender.id,
      messageId: messaging.message.mid,
      text: messaging.message.text ?? null,
      timestamp: messaging.timestamp ?? Date.now(),
      raw: body,
    };
  } catch {
    return null;
  }
}

export function normalizeFacebookDMInbound(body: any): NormalizedInboundEvent | null {
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message) return null;
    return {
      channel: 'facebook',
      accountId: entry.id,
      from: messaging.sender.id,
      messageId: messaging.message.mid,
      text: messaging.message.text ?? null,
      timestamp: messaging.timestamp ?? Date.now(),
      raw: body,
    };
  } catch {
    return null;
  }
}

export function normalizeInboundEvent(body: any): NormalizedInboundEvent | null {
  const channel = detectChannel(body);
  if (channel === 'whatsapp') return normalizeWhatsAppInbound(body);
  if (channel === 'instagram') return normalizeInstagramDMInbound(body);
  if (channel === 'facebook') return normalizeFacebookDMInbound(body);
  return null;
}
