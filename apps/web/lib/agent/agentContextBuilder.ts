/**
 * Agent Context Builder
 *
 * Assembles a compact, structured context object for OpenCrow.
 * Reads from existing Prisma models — no new business logic.
 *
 * Design rules:
 * - Compact payloads only (no raw message blobs, no giant prompts)
 * - All DB reads are best-effort (failures produce partial context, not errors)
 * - No raw secrets or tokens included in context
 * - PII limited to what's needed for the agent decision (name, phone masked internally)
 */

import { prisma } from '@/lib/prisma';
import type { AgentTenantContext } from './agentDecisionSchema';

const MAX_CATALOG_ITEMS = 12;
const MAX_RECENT_MESSAGES = 6;

/**
 * Builds the tenant context to include in the OpenCrow agent call.
 * All errors produce partial context — never throws.
 */
export async function buildAgentContext(
  tenantId: string,
  customerPhone: string,
  contactId?: string
): Promise<AgentTenantContext> {
  const ctx: AgentTenantContext = {
    plan: 'free',
    channels: [],
    setupCompleted: false,
  };

  // ── Tenant base info ──────────────────────────────────────────────────────
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessType: true,
        setupCompleted: true,
        businessHours: true,
        aiPrompt: true,
        enabledChannels: true,
      },
    });
    if (tenant) {
      ctx.businessType = tenant.businessType;
      ctx.setupCompleted = tenant.setupCompleted;
      ctx.businessHours = tenant.businessHours;
      // Strip PII/instructions from aiPrompt — just first 300 chars for context
      ctx.aiPrompt = tenant.aiPrompt?.slice(0, 300) ?? null;
      ctx.channels = tenant.enabledChannels
        ? tenant.enabledChannels.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
    }
  } catch {
    // best-effort
  }

  // ── Subscription / plan ───────────────────────────────────────────────────
  try {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true, status: true },
    });
    if (sub) ctx.plan = sub.plan ?? 'free';
  } catch {
    // best-effort
  }

  // ── Contact info (if resolved) ────────────────────────────────────────────
  if (contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, status: true, tags: true },
      });
      if (contact) {
        ctx.contact = {
          id: contact.id,
          name: contact.name,
          status: contact.status,
          tags: contact.tags ?? [],
        };
      }
    } catch {
      // best-effort
    }
  }

  // ── Recent conversation messages ──────────────────────────────────────────
  try {
    const conv = await prisma.conversation.findFirst({
      where: { tenantId, customerPhone, channel: 'whatsapp' },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    });
    if (conv) {
      const msgs = await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'desc' },
        take: MAX_RECENT_MESSAGES,
        select: { content: true, direction: true },
      });
      ctx.recentMessages = msgs
        .reverse()
        .map((m) => ({
          role: m.direction === 'inbound' ? ('customer' as const) : ('assistant' as const),
          text: m.content?.slice(0, 300) ?? '',
        }));
    }
  } catch {
    // best-effort
  }

  // ── Product catalog (compact) ─────────────────────────────────────────────
  try {
    const products = await prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, price: true, category: true, description: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_CATALOG_ITEMS,
    });
    if (products.length > 0) {
      ctx.catalog = products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        isService: false, // products table; actual services are in Service model
      }));
    }
  } catch {
    // best-effort
  }

  // ── Commercial state (if any) ─────────────────────────────────────────────
  try {
    const { getCommercialState } = await import('@/lib/services/commercialStateService');
    const state = await getCommercialState(tenantId, customerPhone);
    if (state && Object.keys(state).length > 0) {
      // Strip any nested secrets — keep only structural info
      ctx.commercialState = {
        hasActiveOffer: !!(state as any).productId,
        productId: (state as any).productId ?? null,
        stage: (state as any).stage ?? null,
      };
    }
  } catch {
    // best-effort — commercialStateService may not always be available
  }

  return ctx;
}
