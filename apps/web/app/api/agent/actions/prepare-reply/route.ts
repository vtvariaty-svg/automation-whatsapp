/**
 * POST /api/agent/actions/prepare-reply
 *
 * Validates a proposed reply text before the agent commits to it.
 * Safety check: blocks replies that look like they contain provider secrets,
 * internal system details, or are obviously too long.
 * Does NOT send the message.
 */
import { NextResponse } from 'next/server';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

const MAX_REPLY_LENGTH = 4096;

// Patterns that suggest the agent is about to leak internal data
const BLOCKED_PATTERNS = [
  /\bJWT_SECRET\b/i,
  /\bOPENCROW_API_KEY\b/i,
  /\bAGENT_GATEWAY_SECRET\b/i,
  /\bDATABASE_URL\b/i,
  /\bsk-[A-Za-z0-9]{20,}\b/, // OpenAI key pattern
  /\bwhatsapp[_-]?token\b/i,
  /\bpayment[_-]?secret\b/i,
];

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { replyText } = body ?? {};

  if (!replyText || typeof replyText !== 'string') {
    return NextResponse.json({ approved: false, blockedReason: 'replyText required' });
  }

  // Length check
  if (replyText.length > MAX_REPLY_LENGTH) {
    return NextResponse.json({
      approved: false,
      blockedReason: `Reply too long: ${replyText.length} chars (max ${MAX_REPLY_LENGTH})`,
    });
  }

  // Secret leak check
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(replyText)) {
      return NextResponse.json({
        approved: false,
        blockedReason: 'Reply contains potentially sensitive system data — blocked',
      });
    }
  }

  return NextResponse.json({
    approved: true,
    replyText: replyText.trim(),
    blockedReason: null,
  });
}
