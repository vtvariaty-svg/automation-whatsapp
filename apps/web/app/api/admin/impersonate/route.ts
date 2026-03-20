import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-api';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * POST /api/admin/impersonate
 * Body: { targetTenantId: string }
 *
 * Emite um JWT de curta duração (2h) com o tenantId do alvo,
 * mantendo role: 'superadmin' para que bypasses continuem ativos.
 * Registra a ação no log de auditoria.
 */
export async function POST(req: Request) {
  const user = await getAuthUser(req);

  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { targetTenantId } = await req.json();
  if (!targetTenantId) {
    return NextResponse.json({ error: 'targetTenantId é obrigatório' }, { status: 400 });
  }

  // Validar que o tenant alvo existe
  const targetTenant = await prisma.tenant.findUnique({
    where: { id: targetTenantId },
    select: { id: true, name: true },
  });

  if (!targetTenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  // Buscar a versão da sessão do admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { sessionVersion: true }
  });

  // Emitir token de impersonação com expiração curta
  const impersonationToken = jwt.sign(
    {
      userId: user.userId,
      tenantId: targetTenantId,
      role: 'superadmin',
      impersonating: targetTenantId,
      sessionVersion: dbUser?.sessionVersion || 1,
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  await logSuperAdminAction(user.userId, 'impersonate', targetTenantId, {
    targetTenantName: targetTenant.name,
  });

  return NextResponse.json({
    token: impersonationToken,
    targetTenant: { id: targetTenant.id, name: targetTenant.name },
    expiresIn: '2h',
  });
}
