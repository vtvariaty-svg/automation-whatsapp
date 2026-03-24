/**
 * COMM1 — Commercial State Service
 * Central helpers for reading/writing the `commercialState` JSON field on Conversation.
 * TTL: 24h — stale state is treated as empty.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CommercialState {
  lastIntent?: string;               // e.g. "buy_product", "price_inquiry"
  awaitingChoice?: boolean;          // true when bot sent a product list and is waiting for selection
  candidateProductIds?: string[];    // products listed for disambiguation
  lastOfferedProductId?: string;     // last product for which offer was sent
  lastCheckoutSentAt?: string;       // ISO datetime of last checkout URL sent
  handoffTriggered?: boolean;        // true if handoff was already triggered in this session
  unresolvedCount?: number;          // how many consecutive unresolved intents
  updatedAt?: string;                // ISO datetime — used for TTL check
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isExpired(state: CommercialState): boolean {
  if (!state.updatedAt) return true;
  return Date.now() - new Date(state.updatedAt).getTime() > TTL_MS;
}

/** Read commercial state for a conversation. Returns {} if missing or expired. */
export async function getCommercialState(
  tenantId: string,
  customerPhone: string,
  channel: string = 'whatsapp'
): Promise<CommercialState> {
  const conv = await prisma.conversation.findFirst({
    where: { tenantId, customerPhone, channel },
    orderBy: { lastMessageAt: 'desc' },
    select: { commercialState: true },
  });

  if (!conv?.commercialState) return {};

  try {
    const state = conv.commercialState as CommercialState;
    if (isExpired(state)) return {};
    return state;
  } catch {
    return {};
  }
}

/** Merge partial state into the conversation's commercialState. Stamps updatedAt automatically. */
export async function setCommercialState(
  tenantId: string,
  customerPhone: string,
  partial: Partial<CommercialState>,
  channel: string = 'whatsapp'
): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: { tenantId, customerPhone, channel },
    orderBy: { lastMessageAt: 'desc' },
    select: { id: true, commercialState: true },
  });

  if (!conv) return;

  let existing: CommercialState = {};
  try {
    const raw = conv.commercialState as CommercialState | null;
    if (raw && !isExpired(raw)) existing = raw;
  } catch {
    existing = {};
  }

  const updated: CommercialState = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { commercialState: updated as any },
  });
}

/** Clear commercial state (e.g. after checkout completed or conversation reset). */
export async function clearCommercialState(
  tenantId: string,
  customerPhone: string,
  channel: string = 'whatsapp'
): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: { tenantId, customerPhone, channel },
    orderBy: { lastMessageAt: 'desc' },
    select: { id: true },
  });

  if (!conv) return;

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { commercialState: Prisma.JsonNull },
  });
}
