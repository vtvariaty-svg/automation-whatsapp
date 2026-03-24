import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { dispatchWhatsAppCampaign } from '@/lib/services/lead-intelligence/whatsappCampaignDispatchService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const draft = await prisma.leadCampaignDraft.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: {
      leadCandidate: true,
      tenant: true,
    },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  if (draft.channel !== 'whatsapp') {
    return NextResponse.json({ error: 'Apenas rascunhos de whatsapp podem ser disparados por esta rota.' }, { status: 400 });
  }

  if (draft.status !== 'approved') {
    return NextResponse.json({ error: 'Apenas rascunhos aprovados podem ser disparados.' }, { status: 400 });
  }

  if (!draft.leadCandidate) {
    return NextResponse.json({ error: 'Candidato (destinatário) não encontrado.' }, { status: 400 });
  }

  const tenant = draft.tenant;

  const result = await dispatchWhatsAppCampaign(draft, draft.leadCandidate, tenant);

  if (result.success) {
    const updatedDraft = await prisma.leadCampaignDraft.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        providerMessageId: result.providerMessageId,
        providerChannel: 'whatsapp',
        deliveryMeta: { deliveredTo: result.deliveredTo },
        errorMessage: null,
      },
      include: {
        leadCandidate: { select: { id: true, companyName: true, email: true, phone: true, mobilePhone: true, status: true } },
      },
    });
    return NextResponse.json({ draft: updatedDraft, success: true });
  } else {
    const updatedDraft = await prisma.leadCampaignDraft.update({
      where: { id },
      data: {
        status: 'failed',
        providerChannel: 'whatsapp',
        errorMessage: result.errorMessage,
      },
      include: {
        leadCandidate: { select: { id: true, companyName: true, email: true, phone: true, mobilePhone: true, status: true } },
      },
    });
    return NextResponse.json({ draft: updatedDraft, success: false, error: result.errorMessage }, { status: 500 });
  }
}
