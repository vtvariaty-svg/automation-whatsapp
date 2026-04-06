import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const rawLimit = parseInt(searchParams.get('limit') ?? '6', 10);
  const limit = Math.min(Math.max(rawLimit, 1), 10);

  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId: auth.tenantId, customerPhone: phone },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true, status: true },
    });

    if (!conversation) {
      return NextResponse.json({ status: 'none', messageCount: 0, messages: [] });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { content: true, direction: true, createdAt: true },
    });

    return NextResponse.json({
      status: conversation.status,
      messageCount: messages.length,
      messages: messages.reverse().map((m) => ({
        role: m.direction === 'inbound' ? 'customer' : 'assistant',
        text: m.content?.slice(0, 400) ?? '',
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
