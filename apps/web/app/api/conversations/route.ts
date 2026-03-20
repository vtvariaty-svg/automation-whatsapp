import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const conversations = await prisma.conversation.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        contact:  { select: { id: true, name: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const list = conversations.map((c) => ({
      // id kept as customerPhone for backward-compat with phone-based sub-routes
      id:            c.customerPhone,
      // convId is the real UUID — use for conversationId links in other models
      convId:        c.id,
      phone_number:  c.customerPhone,
      timestamp:     c.lastMessageAt,
      last_message:  c.messages[0]?.content ?? null,
      status:        c.status,
      assigned_user: c.assignedUser,
      channel:       c.channel,
      contactId:     c.contactId   ?? null,
      contactName:   c.contact?.name ?? null,
    }));

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
