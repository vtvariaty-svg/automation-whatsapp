import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns true if the channel item (scope=function) is accessible:
 * - no flag record (default = enabled, not hidden) → allowed
 * - hidden=true → blocked
 * - enabled=false → blocked
 */
export async function isChannelItemAccessible(itemId: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { moduleId_scope: { moduleId: itemId, scope: 'function' } },
    select: { enabled: true, hidden: true },
  });
  if (!flag) return true;
  if (flag.hidden) return false;
  if (!flag.enabled) return false;
  return true;
}

export function channelBlockedResponse(itemId: string): NextResponse {
  return NextResponse.json(
    { error: `Canal "${itemId}" está desativado ou oculto pelo administrador.` },
    { status: 403 },
  );
}

export function channelBlockedRedirect(channel: string, base: string): NextResponse {
  const b = base.startsWith('http') ? base : `https://${base}`;
  return NextResponse.redirect(
    `${b}/dashboard/integrations?error=channel_disabled&channel=${channel}`,
  );
}
