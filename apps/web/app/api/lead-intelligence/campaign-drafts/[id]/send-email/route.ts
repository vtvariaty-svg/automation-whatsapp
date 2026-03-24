import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { dispatchEmailCampaign } from '@/lib/services/lead-intelligence/emailCampaignDispatchService';

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
    },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  if (draft.channel !== 'email') {
    return NextResponse.json({ error: 'Apenas rascunhos de email podem ser disparados por esta rota.' }, { status: 400 });
  }

  if (draft.status !== 'approved') {
    return NextResponse.json({ error: 'Apenas rascunhos aprovados podem ser disparados.' }, { status: 400 });
  }

  if (!draft.leadCandidate) {
    return NextResponse.json({ error: 'Candidato (destinatário) não encontrado.' }, { status: 400 });
  }

  const result = await dispatchEmailCampaign(draft, draft.leadCandidate);

  if (result.success) {
    const updatedDraft = await prisma.leadCampaignDraft.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        providerMessageId: result.providerMessageId,
        errorMessage: null, // clear previous errors if any
      },
      include: {
        leadCandidate: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
            mobilePhone: true,
            status: true,
          },
        },
      },
    });
    return NextResponse.json({ draft: updatedDraft, success: true });
  } else {
    const updatedDraft = await prisma.leadCampaignDraft.update({
      where: { id },
      data: {
        status: 'failed',
        errorMessage: result.errorMessage,
      },
      include: {
        leadCandidate: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
            mobilePhone: true,
            status: true,
          },
        },
      },
    });
    return NextResponse.json({ draft: updatedDraft, success: false, error: result.errorMessage }, { status: 500 });
  }
}
