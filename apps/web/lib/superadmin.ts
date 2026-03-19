import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-api';

interface SuperAdminContext {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

/**
 * Extrates standard HTTP request identifiers
 */
export const getRequestMeta = (req: NextRequest) => {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return { ip, userAgent };
};

/**
 * Valida o JWT E bloqueia no banco se a role for diferente de superadmin ou o user estiver inativo.
 * Lanca um erro customizado que pode ser captado no route handler.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<SuperAdminContext> {
  const authUser = await getAuthUser(req);
  
  if (!authUser) {
    throw new Error('UNAUTHORIZED');
  }

  // Cross-check real role with the DB to avoid stale tokens and bypass tenant silos
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, email: true, role: true, isActive: true, tenantId: true }
  });

  if (!dbUser || !dbUser.isActive) {
    throw new Error('UNAUTHORIZED');
  }

  if (dbUser.role !== 'superadmin') {
    throw new Error('FORBIDDEN');
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    tenantId: dbUser.tenantId,
    role: dbUser.role
  };
}

/**
 * Utilitário de log centralizado do Superadmin para padronizar e sanitizar payloads.
 */
export const auditService = {
  sanitizePayload(payload: any): any {
    if (!payload) return null;
    const clone = JSON.parse(JSON.stringify(payload));
    const sensitiveKeys = ['passwordHash', 'password', 'token', 'secret', 'accessToken', 'cookie'];
    
    const censor = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          censor(obj[key]);
        } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    censor(clone);
    return clone;
  },

  async log(params: {
    actorUserId: string,
    action: string,
    targetUserId?: string,
    targetTenantId?: string,
    entityType?: string,
    entityId?: string,
    before?: any,
    after?: any,
    req?: NextRequest,
    status?: 'success' | 'failed'
  }) {
    const meta = params.req ? getRequestMeta(params.req) : { ip: null, userAgent: null };
    
    await prisma.superAdminLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        targetUserId: params.targetUserId,
        targetTenantId: params.targetTenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: this.sanitizePayload(params.before),
        afterJson: this.sanitizePayload(params.after),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        status: params.status || 'success',
      }
    });
  }
};
