import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

interface StartBody {
  phone?: unknown;
  contactId?: unknown;
  contactName?: unknown;
  channel?: unknown;
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: StartBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const phone     = typeof body.phone     === 'string' ? body.phone.trim()     : undefined;
  const contactId = typeof body.contactId === 'string' ? body.contactId.trim() : undefined;
  const channel   = typeof body.channel   === 'string' ? body.channel.trim()   : 'whatsapp';

  if (!phone) {
    return NextResponse.json({ error: 'Telefone (phone) é obrigatório.' }, { status: 400 });
  }

  // If contactId provided, verify it belongs to this tenant
  let resolvedContactId: string | null = null;
  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId: auth.tenantId },
    });
    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado.' }, { status: 404 });
    }
    resolvedContactId = contact.id;
  }

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
    // Link to contact if not yet linked and we have one
    if (!existing.contactId && resolvedContactId) {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { contactId: resolvedContactId },
      });
    }
    return NextResponse.json({
      success: true,
      conversationId: existing.id,
      phone,
      contactId: resolvedContactId ?? existing.contactId ?? null,
      reused: true,
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
      tenantId: auth.tenantId,
      customerPhone: phone,
      status: 'human',
      channel,
      contactId: resolvedContactId ?? null,
      lastMessageAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    conversationId: conversation.id,
    phone,
    contactId: resolvedContactId ?? null,
    reused: false,
  });
}
