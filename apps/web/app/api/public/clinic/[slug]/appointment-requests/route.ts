// Public endpoint — no auth required
// POST /api/public/clinic/[slug]/appointment-requests
// Creates an AppointmentRequest for a published clinic.
// Does NOT expose tenantId, internal data, or prior records.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

function waLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function sanitize(s: string, max: number): string {
  return String(s).trim().slice(0, max);
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function isPastDate(value: string): boolean {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day) < todayUtc;
}

function isValidClockTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Rate limit: 5 requests per IP+slug per 10 minutes
  const ip = getClientIp(request);
  const rl = checkRateLimit(`clinic-appt:${ip}:${slug}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas solicitações. Tente novamente em alguns minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  // Find published clinic by slug only — never by tenantId from client
  const profile = await prisma.clinicProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      tenantId: true,
      displayName: true,
      whatsappPhone: true,
      isPublished: true,
    },
  });

  if (!profile || !profile.isPublished) {
    return NextResponse.json({ error: 'Clínica não encontrada.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; return generic 400
  if (body.website && String(body.website).trim() !== '') {
    return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 });
  }

  // --- Validation ---
  const customerName = typeof body.customerName === 'string' ? sanitize(body.customerName, 120) : '';
  const customerPhone = typeof body.customerPhone === 'string'
    ? body.customerPhone.replace(/\D/g, '').slice(0, 20)
    : '';

  if (customerName.length < 2) {
    return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres.' }, { status: 400 });
  }
  if (customerPhone.length < 8) {
    return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 });
  }

  const customerEmail = typeof body.customerEmail === 'string' && body.customerEmail.trim()
    ? sanitize(body.customerEmail, 200)
    : undefined;
  if (customerEmail && (!customerEmail.includes('@') || customerEmail.length > 200)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }

  const notes = typeof body.notes === 'string' ? sanitize(body.notes, 500) : undefined;

  const preferredDate = typeof body.preferredDate === 'string' && body.preferredDate.trim()
    ? sanitize(body.preferredDate, 10)
    : undefined;
  if (preferredDate && !isValidCalendarDate(preferredDate)) {
    return NextResponse.json({ error: 'Data deve estar no formato YYYY-MM-DD e ser uma data válida.' }, { status: 400 });
  }
  if (preferredDate && isPastDate(preferredDate)) {
    return NextResponse.json({ error: 'Data preferida não pode estar no passado.' }, { status: 400 });
  }

  const preferredTime = typeof body.preferredTime === 'string' && body.preferredTime.trim()
    ? sanitize(body.preferredTime, 5)
    : undefined;
  if (preferredTime && !isValidClockTime(preferredTime)) {
    return NextResponse.json({ error: 'Horário deve estar no formato HH:MM e ser um horário válido.' }, { status: 400 });
  }

  // Validate optional serviceId against this clinic
  let serviceId: string | undefined;
  let serviceName: string | undefined;
  if (body.serviceId && typeof body.serviceId === 'string') {
    const svc = await prisma.clinicService.findFirst({
      where: { id: body.serviceId, clinicProfileId: profile.id, isActive: true },
      select: { id: true, name: true },
    });
    if (!svc) {
      return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400 });
    }
    serviceId = svc.id;
    serviceName = svc.name;
  }

  // Validate optional professionalId against this clinic
  let professionalId: string | undefined;
  let professionalName: string | undefined;
  if (body.professionalId && typeof body.professionalId === 'string') {
    const prof = await prisma.clinicProfessional.findFirst({
      where: { id: body.professionalId, clinicProfileId: profile.id, isActive: true },
      select: { id: true, name: true },
    });
    if (!prof) {
      return NextResponse.json({ error: 'Profissional inválido.' }, { status: 400 });
    }
    professionalId = prof.id;
    professionalName = prof.name;
  }

  // Create request
  const apptRequest = await prisma.appointmentRequest.create({
    data: {
      tenantId: profile.tenantId,
      clinicProfileId: profile.id,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      professionalId,
      preferredDate,
      preferredTime,
      notes,
      status: 'NEW',
      source: 'public_page',
    },
    select: { id: true, status: true },
  });

  // Build WhatsApp message
  const preferenceStr = preferredDate
    ? `${preferredDate}${preferredTime ? ` às ${preferredTime}` : ''}`
    : 'A combinar';

  const waMessage = [
    `Olá, vim pela página da ${profile.displayName} e acabei de enviar uma solicitação de agendamento.`,
    ``,
    `Nome: ${customerName}`,
    `Telefone: +${customerPhone}`,
    `Serviço: ${serviceName ?? 'Não informado'}`,
    `Profissional: ${professionalName ?? 'Sem preferência'}`,
    `Preferência: ${preferenceStr}`,
    notes ? `Observação: ${notes.slice(0, 200)}` : null,
    ``,
    `Pode me ajudar a confirmar?`,
  ].filter(l => l !== null).join('\n');

  const whatsappUrl = profile.whatsappPhone ? waLink(profile.whatsappPhone, waMessage) : null;

  return NextResponse.json({
    id: apptRequest.id,
    status: apptRequest.status,
    whatsappUrl,
    message: 'Solicitação registrada com sucesso.',
  }, { status: 201 });
}
