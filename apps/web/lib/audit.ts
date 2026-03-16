/**
 * L4 – Tenant-level audit log for sensitive actions.
 * Non-blocking — log failures must not crash the caller.
 *
 * Usage:
 *   audit(tenantId, 'instagram.connect', { pageId, igAccountId });
 *   audit(tenantId, 'conversation.takeover', { phone }, userId);
 */
import { prisma } from '@/lib/prisma';

export async function audit(
  tenantId: string,
  action: string,
  metadata?: Record<string, unknown>,
  userId?: string,
  resource?: string,
  resourceId?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: userId ?? null,
        action,
        resource: resource ?? null,
        resourceId: resourceId ?? null,
        metadata: metadata as any ?? undefined,
      },
    });
  } catch (e) {
    console.error('[Audit] Failed to write audit log:', e);
  }
}
