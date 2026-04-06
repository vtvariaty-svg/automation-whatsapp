/**
 * POST /api/agent/actions/prepare-handoff
 *
 * Validates whether a human handoff is possible given the current conversation state.
 * Does NOT execute the handoff — returns parameters for safe backend execution.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

const VALID_REASONS = ['explicit_request', 'ai_low_confidence', 'requires_human_approval', 'repetition'];

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { customerPhone, reason } = body ?? {};

  if (!customerPhone) return NextResponse.json({ error: 'customerPhone required' }, { status: 400 });
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}` }, { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId: auth.tenantId, customerPhone },
      orderBy: { lastMessageAt: 'desc' },
      select: { status: true },
    });

    const currentStatus = conversation?.status ?? 'none';
    const alreadyHuman = currentStatus === 'human' || currentStatus === 'waiting';

    return NextResponse.json({
      canHandoff: !alreadyHuman,
      currentStatus,
      alreadyHuman,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
