import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const SUPERADMIN_ROLE = 'superadmin';

export function isSuperAdmin(role?: string): boolean {
  return role === SUPERADMIN_ROLE;
}

/**
 * Registra ações sensíveis do superadmin no banco.
 * Non-blocking — erros de log não interrompem o fluxo principal.
 */
export async function logSuperAdminAction(
  adminUserId: string,
  action: string,
  targetTenantId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.superAdminLog.create({
      data: {
        adminUserId,
        action,
        targetTenantId: targetTenantId ?? null,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error('[SuperAdmin] Erro ao registrar ação no log:', e);
  }
}
