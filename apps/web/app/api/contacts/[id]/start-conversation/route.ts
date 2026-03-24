import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contato não encontrado.' }, { status: 404 });
  }

  const phone = contact.normalizedPhone ?? contact.phone;

  if (!phone) {
    return NextResponse.json(
      { error: 'Este contato não possui telefone cadastrado.' },
      { status: 400 },
    );
  }

  const channel = contact.lastChannelUsed ?? 'whatsapp';

  // Reuse any open/human/waiting conversation for this phone
  const existing = await prisma.conversation.findFirst({
    where: {
      tenantId: auth.tenantId,
      customerPhone: phone,
      status: { in: ['open', 'human', 'waiting'] },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  if (existing) {
    // Link to contact if not already linked
    if (!existing.contactId) {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { contactId: contact.id },
      });
    }
    return NextResponse.json({
      success: true,
      conversationId: existing.id,
      phone,
      contactId: contact.id,
      reused: true,
    });
  }

  // Create a new conversation ready for human operator
  const conversation = await prisma.conversation.create({
    data: {
      tenantId: auth.tenantId,
      customerPhone: phone,
      status: 'human',
      channel,
      contactId: contact.id,
      lastMessageAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    conversationId: conversation.id,
    phone,
    contactId: contact.id,
    reused: false,
  });
}
