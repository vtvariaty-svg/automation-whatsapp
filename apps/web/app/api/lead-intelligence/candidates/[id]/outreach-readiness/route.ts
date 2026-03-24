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

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  let outreachStatus = 'not_ready';
  const blockers: string[] = [];

  if (candidate.status !== 'approved') {
    outreachStatus = 'blocked';
    blockers.push('Lead não aprovado para ativação');
  } else {
    // Lead is approved, evaluate readiness
    const hasEmailStr = !!candidate.email;
    const hasPhoneStr = !!candidate.phone || !!candidate.mobilePhone;

    const emailReady = hasEmailStr && candidate.emailConsentStatus === 'granted';
    const whatsappReady = hasPhoneStr && candidate.whatsappConsentStatus === 'granted';

    if (!hasEmailStr) blockers.push('Lead sem email válido');
    else if (candidate.emailConsentStatus !== 'granted') blockers.push('Email sem consentimento');

    if (!hasPhoneStr) blockers.push('Lead sem telefone para WhatsApp');
    else if (candidate.whatsappConsentStatus !== 'granted') blockers.push('WhatsApp sem consentimento');

    if (emailReady && whatsappReady) {
      outreachStatus = 'ready_multichannel';
    } else if (emailReady) {
      outreachStatus = 'ready_email';
    } else if (whatsappReady) {
      outreachStatus = 'ready_whatsapp';
    } else {
      outreachStatus = 'blocked';
    }
  }

  const outreachBlockReason = blockers.length > 0 ? blockers.join('; ') : null;

  const updatedCandidate = await prisma.leadCandidate.update({
    where: { id },
    data: {
      outreachStatus,
      outreachBlockReason,
      lastReadinessCheckedAt: new Date(),
    },
  });

  return NextResponse.json({ candidate: updatedCandidate, readinessResult: { outreachStatus, blockers } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  let body: { emailConsentStatus?: unknown; whatsappConsentStatus?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }
  const dataToUpdate: Record<string, string> = {};

  const allowedConsentValues = ['unknown', 'granted', 'denied'];

  if (typeof body.emailConsentStatus === 'string' && allowedConsentValues.includes(body.emailConsentStatus)) {
    dataToUpdate.emailConsentStatus = body.emailConsentStatus;
  }
  if (typeof body.whatsappConsentStatus === 'string' && allowedConsentValues.includes(body.whatsappConsentStatus)) {
    dataToUpdate.whatsappConsentStatus = body.whatsappConsentStatus;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualização' }, { status: 400 });
  }

  const updatedCandidate = await prisma.leadCandidate.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({ candidate: updatedCandidate });
}
