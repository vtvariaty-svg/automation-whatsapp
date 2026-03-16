/**
 * Attribution helper library
 * Tracks first-touch and last-touch attribution for contacts across channels.
 * All functions are async and safe to fire-and-forget at call sites.
 */
import { prisma } from '@/lib/prisma';

export type AttributionSource =
  | 'instagram_dm'
  | 'instagram_comment'
  | 'facebook_dm'
  | 'whatsapp'
  | 'manual'
  | 'template';

export type AttributionMedium = 'organic' | 'paid' | 'referral' | 'direct';

/**
 * Record a touch point for a contact.
 * - On first touch: sets both first* and last* fields.
 * - On subsequent touches: only updates last* fields and fills in any
 *   linkedIds that are not already set.
 */
export async function touchAttribution(
  tenantId: string,
  contactId: string,
  source: AttributionSource,
  medium?: AttributionMedium,
  campaign?: string,
  linkedIds?: {
    conversationId?: string;
    opportunityId?: string;
    appointmentId?: string;
    orderId?: string;
  }
): Promise<void> {
  await prisma.leadAttribution.upsert({
    where: {
      tenantId_contactId: { tenantId, contactId },
    },
    create: {
      tenantId,
      contactId,
      // first touch
      firstSource: source,
      firstMedium: medium ?? null,
      firstCampaign: campaign ?? null,
      // last touch mirrors first touch on creation
      lastSource: source,
      lastMedium: medium ?? null,
      lastCampaign: campaign ?? null,
      // linked entity ids
      conversationId: linkedIds?.conversationId ?? null,
      opportunityId: linkedIds?.opportunityId ?? null,
      appointmentId: linkedIds?.appointmentId ?? null,
      orderId: linkedIds?.orderId ?? null,
      converted: false,
    },
    update: {
      // always update last-touch
      lastSource: source,
      lastMedium: medium ?? null,
      lastCampaign: campaign ?? null,
      // fill in linked ids only when not already set
      ...(linkedIds?.conversationId
        ? { conversationId: linkedIds.conversationId }
        : {}),
      ...(linkedIds?.opportunityId
        ? { opportunityId: linkedIds.opportunityId }
        : {}),
      ...(linkedIds?.appointmentId
        ? { appointmentId: linkedIds.appointmentId }
        : {}),
      ...(linkedIds?.orderId ? { orderId: linkedIds.orderId } : {}),
    },
  });
}

/**
 * Mark a contact's attribution record as converted.
 * Optionally records the revenue amount associated with the conversion.
 */
export async function markConverted(
  tenantId: string,
  contactId: string,
  revenueAmount?: number
): Promise<void> {
  await prisma.leadAttribution.updateMany({
    where: { tenantId, contactId },
    data: {
      converted: true,
      convertedAt: new Date(),
      ...(revenueAmount !== undefined ? { revenueAmount } : {}),
    },
  });
}
