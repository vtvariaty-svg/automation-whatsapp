/**
 * AG2/AG3/AG4 — Conversational Appointment Flow
 *
 * Unified state machine for:
 * - AG2: New booking (slot selection)
 * - AG3: Presence confirmation reply
 * - AG4: Cancellation and reschedule via chat
 *
 * State stored in CustomerMemory.notes as JSON.
 */

import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { suggestNextSlots, createAppointment, rescheduleAppointment, cancelAppointment } from './schedulingService';
import { sendBookingConfirmation } from './appointmentReminderService';
import { upsertContactByPhone, addContactEvent } from '@/lib/services/contactService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotOption {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  label: string;  // human-readable: "Seg 20/01 às 09:00"
  // AG5 — professional auto-assignment
  professionalId?: string;
  professionalName?: string;
}

interface PendingBookingState {
  step: 'selecting_slot';
  service: string;
  slots: SlotOption[];
  expiresAt: number;
}

// AG4
interface PendingCancelState {
  step: 'confirming_cancel';
  appointmentId: string;
  service: string;
  date: string;
  time: string;
  expiresAt: number;
}

interface PendingRescheduleState {
  step: 'selecting_new_slot';
  appointmentId: string;
  service: string;
  slots: SlotOption[];
  expiresAt: number;
}

type PendingState = PendingBookingState | PendingCancelState | PendingRescheduleState;

const PENDING_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Keywords that signal a scheduling intent
const BOOKING_KEYWORDS = [
  'agendar', 'agendamento', 'marcar', 'reservar', 'consulta',
  'horário disponível', 'tem horário', 'tem vaga', 'disponibilidade',
  'quero marcar', 'preciso marcar', 'quero agendar', 'quero reservar',
  'agenda', 'quando posso', 'próximo horário', 'fazer um horário',
];

// AG4 keywords
const CANCEL_KEYWORDS = [
  'cancelar', 'cancelamento', 'quero cancelar', 'preciso cancelar',
  'desmarcar', 'quero desmarcar', 'cancela meu', 'cancela o agendamento',
];

const RESCHEDULE_KEYWORDS = [
  'remarcar', 'reagendar', 'remarcação', 'quero remarcar', 'preciso remarcar',
  'mudar horário', 'trocar horário', 'outro horário', 'quero reagendar',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function detectBookingIntent(text: string): boolean {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedKeywords = BOOKING_KEYWORDS.map(k =>
    k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );
  return normalizedKeywords.some(kw => lower.includes(kw));
}

function formatSlotList(service: string, slots: SlotOption[]): string {
  const list = slots.map((s, i) => `*${i + 1}.* ${s.label}`).join('\n');
  return `📅 *Agendamento — ${service}*\n\nHorários disponíveis:\n${list}\n\nResponda com o *número* do horário desejado. Se quiser cancelar esta etapa, envie *cancelar*.`;
}

function formatInvalidSlotSelection(service: string, slots: SlotOption[]): string {
  return `Não consegui identificar o horário escolhido. Por favor, responda apenas com um número de *1* a *${slots.length}*.\n\n${formatSlotList(service, slots)}`;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isAbortCurrentFlow(text: string): boolean {
  const normalized = normalizeText(text);
  return ['cancelar', 'sair', 'parar', 'desistir'].some(kw => normalized === kw || normalized.includes(` ${kw}`));
}

// ─── State management in CustomerMemory.notes ────────────────────────────────

type PendingKey = 'pendingBooking' | 'pendingCancel' | 'pendingReschedule';

async function getRawNotes(tenantId: string, phone: string): Promise<Record<string, unknown>> {
  const memory = await prisma.customerMemory.findUnique({
    where: { tenantId_contactId: { tenantId, contactId: phone } },
  });
  if (!memory?.notes) return {};
  try { return JSON.parse(memory.notes); } catch { return {}; }
}

async function getPendingState(tenantId: string, phone: string): Promise<(PendingState & { _key: PendingKey }) | null> {
  const raw = await getRawNotes(tenantId, phone);

  for (const key of ['pendingBooking', 'pendingCancel', 'pendingReschedule'] as PendingKey[]) {
    const ps = raw[key] as PendingState | undefined;
    if (!ps) continue;
    if (ps.expiresAt && Date.now() > ps.expiresAt) {
      await clearPendingKey(tenantId, phone, key);
      continue;
    }
    return { ...ps, _key: key };
  }
  return null;
}

async function setPendingKey(tenantId: string, phone: string, key: PendingKey, value: PendingState) {
  const raw = await getRawNotes(tenantId, phone);
  // Clear other pending keys to avoid conflicts
  for (const k of ['pendingBooking', 'pendingCancel', 'pendingReschedule'] as PendingKey[]) {
    delete raw[k];
  }
  raw[key] = value;
  const newNotes = JSON.stringify(raw);
  await prisma.customerMemory.upsert({
    where: { tenantId_contactId: { tenantId, contactId: phone } },
    create: { tenantId, contactId: phone, notes: newNotes },
    update: { notes: newNotes },
  });
}

async function clearPendingKey(tenantId: string, phone: string, key: PendingKey) {
  const raw = await getRawNotes(tenantId, phone);
  if (!(key in raw)) return;
  delete raw[key];
  await prisma.customerMemory.upsert({
    where: { tenantId_contactId: { tenantId, contactId: phone } },
    create: { tenantId, contactId: phone, notes: JSON.stringify(raw) },
    update: { notes: JSON.stringify(raw) },
  });
}

// Legacy alias used internally
async function clearPendingState(tenantId: string, phone: string, _rawNotes?: string) {
  await clearPendingKey(tenantId, phone, 'pendingBooking');
}

/**
 * Returns true if the customer has any active pending appointment state
 * (selecting_slot, confirming_cancel, selecting_new_slot).
 * Used by the webhook pipeline to give business-state flows priority over automations.
 */
export async function hasPendingAppointmentState(tenantId: string, phone: string): Promise<boolean> {
  const pending = await getPendingState(tenantId, phone);
  return pending !== null;
}

/**
 * Clears ALL pending appointment state keys for a customer (pendingBooking,
 * pendingCancel, pendingReschedule). Called when a new session starts after
 * an inactivity timeout so stale mid-flow state cannot hijack a fresh session.
 * Preserves all other CustomerMemory fields (name, preferences, history notes).
 */
export async function clearAllPendingAppointmentState(tenantId: string, phone: string): Promise<void> {
  try {
    const raw = await getRawNotes(tenantId, phone);
    let changed = false;
    for (const key of ['pendingBooking', 'pendingCancel', 'pendingReschedule'] as PendingKey[]) {
      if (key in raw) { delete raw[key]; changed = true; }
    }
    if (!changed) return; // nothing stored — skip write
    await prisma.customerMemory.upsert({
      where: { tenantId_contactId: { tenantId, contactId: phone } },
      create: { tenantId, contactId: phone, notes: JSON.stringify(raw) },
      update: { notes: JSON.stringify(raw) },
    });
  } catch (err) {
    console.error('[AppointmentBooking] clearAllPendingAppointmentState error:', err);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Handles the booking flow for a given message.
 * Returns a reply string if the message was handled by the booking flow,
 * or null if the message should proceed to the AI.
 */
export async function handleBookingFlow(
  tenantId: string,
  phone: string,
  text: string,
  conversationId?: string
): Promise<string | null> {
  // ── Step 2: In-progress slot selection (pendingBooking) ──
  const pending = await getPendingState(tenantId, phone);
  if (pending?.step === 'selecting_slot' && pending._key === 'pendingBooking') {
    if (isAbortCurrentFlow(text)) {
      await clearPendingKey(tenantId, phone, 'pendingBooking');
      return 'Tudo bem, cancelei esta seleção de horário. Quando quiser retomar, é só pedir para agendar novamente. 😊';
    }

    const trimmed = text.trim();
    const numMatch = trimmed.match(/^(\d+)$/);

    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < pending.slots.length) {
        const chosen = pending.slots[idx];
        // Fetch customer name from memory
        const memory = await prisma.customerMemory.findUnique({
          where: { tenantId_contactId: { tenantId, contactId: phone } },
        });
        try {
          const appt = await createAppointment(tenantId, {
            phone,
            customerName: memory?.name ?? undefined,
            service: pending.service,
            date: chosen.date,
            time: chosen.time,
            source: 'whatsapp',
            conversationId,
            professionalId: chosen.professionalId,
            professionalName: chosen.professionalName,
          });
          await clearPendingState(tenantId, phone);

          // Link appointment to Contact + emit lifecycle event (non-blocking)
          upsertContactByPhone({ tenantId, phone, name: memory?.name ?? undefined, source: 'whatsapp' })
            .then(async (contact) => {
              if (!contact) return;
              await prisma.appointment.update({ where: { id: appt.id }, data: { contactId: contact.id } }).catch(() => {});
              await addContactEvent(tenantId, contact.id, 'appointment_created',
                `Agendamento: ${pending.service} em ${chosen.date} às ${chosen.time}h`,
                { appointmentId: appt.id, service: pending.service, date: chosen.date, time: chosen.time }
              ).catch(() => {});
            })
            .catch(() => {});

          // AG3 — fire-and-forget booking confirmation notification (logged in history)
          sendBookingConfirmation(tenantId, appt.id).catch(e =>
            console.error('[BookingFlow] Erro ao enviar confirmação de booking:', e)
          );

          const dayLabel = format(
            new Date(`${chosen.date}T12:00:00`),
            "EEEE',' dd/MM",
            { locale: ptBR }
          );
          const nameGreet = memory?.name ? `, ${memory.name}` : '';
          const profLine = chosen.professionalName ? `\n👤 *Profissional:* ${chosen.professionalName}` : '';
          return `✅ *Agendamento realizado${nameGreet}!*\n\n📋 *Serviço:* ${pending.service}\n📅 *Data:* ${dayLabel}\n🕐 *Horário:* ${chosen.time}h${profLine}\n\nVocê receberá um lembrete antes do horário. Caso precise cancelar ou reagendar, é só avisar aqui! 😊`;
        } catch (e: any) {
          await clearPendingState(tenantId, phone);
          if (e.message?.includes('já está ocupado')) {
            return '⚠️ Ops! Esse horário acabou de ser reservado. Gostaria de ver outros horários disponíveis?';
          }
          return '❌ Ocorreu um erro ao confirmar o agendamento. Por favor, tente novamente.';
        }
      }
    }

    // Couldn't parse selection — re-show the options with explicit recovery guidance.
    return formatInvalidSlotSelection(pending.service, pending.slots);
  }

  // ── Step 1: Detect initial booking intent ──
  if (!detectBookingIntent(text)) return null;

  const services = await prisma.service.findMany({
    where: { tenantId, active: true },
    orderBy: { name: 'asc' },
  });

  if (services.length === 0) {
    return 'Olá! No momento não temos serviços configurados para agendamento. Em breve teremos novidades! 😊';
  }

  // Pick service: try to find one mentioned in the message, else use first
  const textLower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mentionedService = services.find(s =>
    textLower.includes(s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  const selectedService = mentionedService ?? services[0];

  const today = format(new Date(), 'yyyy-MM-dd');
  let slots: Awaited<ReturnType<typeof suggestNextSlots>>;
  try {
    slots = await suggestNextSlots(tenantId, selectedService.name, today, 5);
  } catch {
    return 'Não foi possível carregar os horários disponíveis agora. Por favor, tente novamente em alguns instantes.';
  }

  if (slots.length === 0) {
    return 'No momento não encontramos horários disponíveis para os próximos dias. Entre em contato para verificar a disponibilidade. 📅';
  }

  const slotsWithLabels: SlotOption[] = slots.map(s => ({
    ...s,
    label: [
      `${format(new Date(`${s.date}T12:00:00`), "EEE dd/MM", { locale: ptBR })} às ${s.time}h`,
      s.professionalName ? `com ${s.professionalName}` : '',
    ].filter(Boolean).join(' '),
  }));

  await setPendingKey(tenantId, phone, 'pendingBooking', {
    step: 'selecting_slot',
    service: selectedService.name,
    slots: slotsWithLabels,
    expiresAt: Date.now() + PENDING_TTL_MS,
  });

  return formatSlotList(selectedService.name, slotsWithLabels);
}

// ─── AG3: Presence confirmation reply ─────────────────────────────────────────

const CONFIRMATION_KEYWORDS = ['sim', 'confirmo', 'confirmado', 'confirmar', 'vou', 'estarei', 'ok', 'certo', 'claro', 'com certeza', 'vou sim'];

async function tryHandlePresenceConfirmation(
  tenantId: string,
  phone: string,
  normalized: string
): Promise<string | null> {
  if (normalized.length > 60) return null;
  const isConfirmation = CONFIRMATION_KEYWORDS.some(kw =>
    normalized === kw || normalized.startsWith(kw + ' ') || normalized.endsWith(' ' + kw)
  );
  if (!isConfirmation) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const appt = await prisma.appointment.findFirst({
    where: {
      tenantId,
      customerPhone: phone,
      status: 'agendado',
      confirmationReceivedAt: null,
      date: { gte: today },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  if (!appt) return null;

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { confirmationReceivedAt: new Date(), status: 'confirmado', confirmedAt: new Date() },
  });

  // Emit confirmation event on Contact timeline (non-blocking)
  if (appt.contactId) {
    addContactEvent(tenantId, appt.contactId, 'appointment_confirmed',
      `Presença confirmada: ${appt.service ?? 'Serviço'} em ${appt.date} às ${appt.time}h`,
      { appointmentId: appt.id }
    ).catch(() => {});
  }

  const dayLabel = appt.date
    ? format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR })
    : '';
  return `Perfeito! ✅ Presença confirmada para *${appt.service ?? 'seu serviço'}* em ${dayLabel} às ${appt.time}h.\n\nTe esperamos! 😊`;
}

/** @deprecated Use handleAppointmentMessage instead */
export async function handleConfirmationReply(tenantId: string, phone: string, text: string): Promise<string | null> {
  return tryHandlePresenceConfirmation(tenantId, phone, text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

// ─── AG4: Cancel flow ─────────────────────────────────────────────────────────

function detectCancelIntent(normalized: string): boolean {
  return CANCEL_KEYWORDS.some(kw =>
    normalized.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

function detectRescheduleIntent(normalized: string): boolean {
  return RESCHEDULE_KEYWORDS.some(kw =>
    normalized.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

async function getNextActiveAppointment(tenantId: string, phone: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return prisma.appointment.findFirst({
    where: {
      tenantId,
      customerPhone: phone,
      status: { in: ['agendado', 'confirmado'] },
      date: { gte: today },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
}

// ─── AG4: Unified message handler ─────────────────────────────────────────────

/**
 * Unified appointment message handler (AG2 + AG3 + AG4).
 * Priority: pending state → cancel intent → reschedule intent → booking intent → presence confirmation
 * Returns reply string or null (pass to AI).
 */
export async function handleAppointmentMessage(
  tenantId: string,
  phone: string,
  text: string,
  conversationId?: string
): Promise<string | null> {
  const normalized = normalizeText(text);
  const pending = await getPendingState(tenantId, phone);

  // ── Handle pending cancel confirmation ──
  if (pending?.step === 'confirming_cancel') {
    const ps = pending as PendingCancelState & { _key: PendingKey };
    const isYes = CONFIRMATION_KEYWORDS.some(kw => normalized === kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const isNo = ['nao', 'não', 'não quero', 'desistir', 'desistir'].some(kw => normalized.includes(kw));

    if (isYes) {
      await clearPendingKey(tenantId, phone, 'pendingCancel');
      try {
        const canceledAppt = await prisma.appointment.findUnique({ where: { id: ps.appointmentId }, select: { contactId: true } }).catch(() => null);
        await cancelAppointment(tenantId, ps.appointmentId);
        // Emit cancellation event (non-blocking)
        if (canceledAppt?.contactId) {
          addContactEvent(tenantId, canceledAppt.contactId, 'appointment_cancelled',
            `Agendamento cancelado: ${ps.service} em ${ps.date} às ${ps.time}h`,
            { appointmentId: ps.appointmentId }
          ).catch(() => {});
        }
        const dayLabel = format(new Date(`${ps.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR });
        return `✅ Agendamento cancelado.\n\nSeu *${ps.service}* em ${dayLabel} às ${ps.time}h foi cancelado.\n\nSe quiser reagendar, é só nos avisar! 😊`;
      } catch {
        return '❌ Não foi possível cancelar o agendamento agora. Tente novamente.';
      }
    }
    if (isNo) {
      await clearPendingKey(tenantId, phone, 'pendingCancel');
      return 'Tudo bem! Seu agendamento segue mantido. 😊';
    }
    // Re-ask
    const dayLabel = format(new Date(`${ps.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR });
    return `Confirma o cancelamento do *${ps.service}* em ${dayLabel} às ${ps.time}h?\n\nResponda *SIM* para confirmar ou *NÃO* para manter.`;
  }

  // ── Handle pending reschedule slot selection ──
  if (pending?.step === 'selecting_new_slot' && pending._key === 'pendingReschedule') {
    const ps = pending as PendingRescheduleState & { _key: PendingKey };
    if (isAbortCurrentFlow(text)) {
      await clearPendingKey(tenantId, phone, 'pendingReschedule');
      return 'Tudo bem! Seu agendamento atual segue mantido. 😊';
    }

    const numMatch = text.trim().match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < ps.slots.length) {
        const chosen = ps.slots[idx];
        await clearPendingKey(tenantId, phone, 'pendingReschedule');
        try {
          const rescheduledAppt = await prisma.appointment.findUnique({ where: { id: ps.appointmentId }, select: { contactId: true } }).catch(() => null);
          await rescheduleAppointment(tenantId, ps.appointmentId, chosen.date, chosen.time);
          // Emit reschedule event (non-blocking)
          if (rescheduledAppt?.contactId) {
            addContactEvent(tenantId, rescheduledAppt.contactId, 'appointment_rescheduled',
              `Agendamento remarcado: ${ps.service} para ${chosen.date} às ${chosen.time}h`,
              { appointmentId: ps.appointmentId, newDate: chosen.date, newTime: chosen.time }
            ).catch(() => {});
          }
          const dayLabel = format(new Date(`${chosen.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR });
          return `✅ *Remarcação confirmada!*\n\n📋 *Serviço:* ${ps.service}\n📅 *Nova data:* ${dayLabel}\n🕐 *Horário:* ${chosen.time}h\n\nTe esperamos! 😊`;
        } catch (e: any) {
          await clearPendingKey(tenantId, phone, 'pendingReschedule');
          if (e.message?.includes('já está ocupado')) {
            return '⚠️ Esse horário acabou de ser reservado. Gostaria de ver outros horários disponíveis?';
          }
          return '❌ Não foi possível remarcar. Por favor, tente novamente.';
        }
      }
    }
    return formatInvalidSlotSelection(ps.service, ps.slots);
  }

  // ── Handle pending booking slot selection ──
  if (pending?.step === 'selecting_slot' && pending._key === 'pendingBooking') {
    return handleBookingFlow(tenantId, phone, text, conversationId);
  }

  // ── AG4: Cancel intent ──
  if (detectCancelIntent(normalized)) {
    const appt = await getNextActiveAppointment(tenantId, phone);
    if (!appt) return 'Não encontrei nenhum agendamento ativo para cancelar. Se precisar de ajuda, é só falar!';

    const dayLabel = format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR });
    await setPendingKey(tenantId, phone, 'pendingCancel', {
      step: 'confirming_cancel',
      appointmentId: appt.id,
      service: appt.service ?? 'Serviço',
      date: appt.date!,
      time: appt.time ?? '',
      expiresAt: Date.now() + PENDING_TTL_MS,
    });
    return `Encontrei seu agendamento:\n\n📋 *${appt.service ?? 'Serviço'}*\n📅 ${dayLabel} às ${appt.time}h\n\nConfirma o *cancelamento*?\n\nResponda *SIM* para cancelar ou *NÃO* para manter.`;
  }

  // ── AG4: Reschedule intent ──
  if (detectRescheduleIntent(normalized)) {
    const appt = await getNextActiveAppointment(tenantId, phone);
    if (!appt) return 'Não encontrei nenhum agendamento ativo para remarcar. Quer fazer um novo agendamento?';

    const today = format(new Date(), 'yyyy-MM-dd');
    let slots: Awaited<ReturnType<typeof suggestNextSlots>>;
    try {
      slots = await suggestNextSlots(tenantId, appt.service ?? '', today, 5);
    } catch {
      return 'Não foi possível carregar os horários disponíveis agora. Por favor, tente novamente.';
    }
    if (slots.length === 0) {
      return 'No momento não encontramos horários disponíveis para os próximos dias. Entre em contato para verificar a disponibilidade.';
    }

    const dayLabel = format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd/MM", { locale: ptBR });
    const availableNewSlots = slots.filter(s => !(s.date === appt.date && s.time === appt.time));
    if (availableNewSlots.length === 0) {
      return 'No momento não encontramos outro horário disponível para remarcar. Entre em contato para verificar a disponibilidade.';
    }

    const slotsWithLabels: SlotOption[] = availableNewSlots.map(s => ({
      ...s,
      label: [
        `${format(new Date(`${s.date}T12:00:00`), "EEE dd/MM", { locale: ptBR })} às ${s.time}h`,
        s.professionalName ? `com ${s.professionalName}` : '',
      ].filter(Boolean).join(' '),
    }));

    await setPendingKey(tenantId, phone, 'pendingReschedule', {
      step: 'selecting_new_slot',
      appointmentId: appt.id,
      service: appt.service ?? 'Serviço',
      slots: slotsWithLabels,
      expiresAt: Date.now() + PENDING_TTL_MS,
    });

    const currentInfo = `_Agendamento atual: ${appt.service} em ${dayLabel} às ${appt.time}h_\n\n`;
    return currentInfo + formatSlotList(appt.service ?? 'Serviço', slotsWithLabels).replace('Agendamento —', 'Nova data para');
  }

  // ── AG2: Booking intent ──
  if (detectBookingIntent(text)) {
    return handleBookingFlow(tenantId, phone, text, conversationId);
  }

  // ── AG3: Presence confirmation ("SIM" with no pending state) ──
  return tryHandlePresenceConfirmation(tenantId, phone, normalized);
}
