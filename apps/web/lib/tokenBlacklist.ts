import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Revoga um token JWT adicionando seu hash na blacklist.
 * Remove entradas expiradas como cleanup lazy.
 * @param token - JWT bruto
 * @param expiresAt - data de expiração original do JWT
 */
export async function revokeToken(token: string, expiresAt: Date): Promise<void> {
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    // Inserir o token revogado
    prisma.revokedToken.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: { expiresAt },
    }),
    // Cleanup lazy: remover entradas já expiradas
    prisma.revokedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);
}

/**
 * Verifica se um token está na blacklist.
 * Retorna false em caso de erro de banco (fail open — prioriza disponibilidade).
 */
export async function isRevoked(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);
    const entry = await prisma.revokedToken.findUnique({
      where: { tokenHash },
      select: { expiresAt: true },
    });
    if (!entry) return false;
    // Entrada expirada no banco — token já não seria válido pelo JWT mesmo
    if (entry.expiresAt < new Date()) return false;
    return true;
  } catch {
    return false;
  }
}
