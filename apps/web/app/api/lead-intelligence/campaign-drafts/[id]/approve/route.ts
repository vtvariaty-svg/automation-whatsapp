import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const draft = await prisma.leadCampaignDraft.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Rascunho não encontrado.' }, { status: 404 });
  }

  if (draft.status !== 'draft') {
    return NextResponse.json({ error: 'Apenas rascunhos com status "draft" podem ser aprovados ou rejeitados.' }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (body.action !== 'approved' && body.action !== 'rejected') {
    return NextResponse.json({ error: 'A ação deve ser "approved" ou "rejected"' }, { status: 400 });
  }

  const updatedDraft = await prisma.leadCampaignDraft.update({
    where: { id },
    data: {
      status: body.action,
      approvedAt: new Date(),
      // Extract userId from auth if available, otherwise just use a fallback string
      // NOTE: `getAuthTenant` usually provides tenantId and often userId depending on implementation.
      approvedBy: (auth as any).userId || 'system',
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

  return NextResponse.json({ draft: updatedDraft });
}
