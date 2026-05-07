import { prisma } from '@/lib/prisma';
import { parse, addMinutes, addDays, isBefore, isAfter, format } from 'date-fns';
import { upsertContactByPhone, addContactEvent } from '@/lib/services/contactService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAppointmentData {
  phone: string;
  customerName?: string;
  service: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  notes?: string;
  // AG2 — conversational booking
  source?: string;         // manual | whatsapp | instagram | facebook
  conversationId?: string;
  // AG5 — professional assignment
  professionalId?: string;
  professionalName?: string;
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createService(tenantId: string, data: any) {
  return prisma.service.create({
    data: {
      tenantId,
      name: data.name,
      durationMinutes: data.durationMinutes ?? 30,
      bufferBeforeMinutes: data.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: data.bufferAfterMinutes ?? 0,
      active: data.active ?? true,
    },
  });
}

export async function updateService(tenantId: string, id: string, data: any) {
  return prisma.service.update({ where: { id, tenantId }, data });
}

export async function deleteService(tenantId: string, id: string) {
  return prisma.service.delete({ where: { id, tenantId } });
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function getAppointments(
  tenantId: string,
  opts?: { date?: string; status?: string; limit?: number }
) {
  return prisma.appointment.findMany({
    where: {
      tenantId,
      ...(opts?.date ? { date: opts.date } : {}),
      ...(opts?.status ? { status: opts.status } : {}),
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    ...(opts?.limit ? { take: opts.limit } : {}),
  });
}

export async function updateAppointmentStatus(
  tenantId: string,
  id: string,
  status: string
) {
  const timestamps: any = {};
  if (status === 'confirmado') timestamps.confirmedAt = new Date();
  if (status === 'cancelado') timestamps.cancelledAt = new Date();
  if (status === 'no_show') timestamps.cancelledAt = new Date(); // treat no_show as de-facto cancel for slot availability

  const appt = await prisma.appointment.update({
    where: { id, tenantId },
    data: { status, ...timestamps },
  });

  // Fire contact event for relevant status changes (non-blocking)
  if (appt.contactId) {
    const eventMap: Record<string, { type: string; title: string }> = {
      confirmado: { type: 'appointment_confirmed', title: 'Agendamento confirmado' },
      cancelado: { type: 'appointment_cancelled', title: 'Agendamento cancelado' },
      concluido: { type: 'appointment_completed', title: 'Agendamento concluído' },
      no_show: { type: 'appointment_no_show', title: 'Não compareceu ao agendamento' },
    };
    const ev = eventMap[status];
    if (ev) {
      addContactEvent(tenantId, appt.contactId, ev.type, ev.title, {
        appointmentId: id,
        service: appt.service,
        date: appt.date,
        time: appt.time,
      }).catch((err) =>
        console.error('[ContactEvent] Failed to add appointment status event', {
          tenantId, appointmentId: id, error: err?.message ?? err,
        })
      );
    }
  }

  return appt;
}

/**
 * Creates an appointment after verifying the slot is still free.
 * Throws if a conflict is detected.
 */
export async function createAppointment(tenantId: string, data: CreateAppointmentData) {
  // Resolve service duration for snapshot
  const service = await prisma.service.findFirst({
    where: { tenantId, name: { equals: data.service, mode: 'insensitive' }, active: true },
  });
  const durationMinutes = service?.durationMinutes ?? 30;

  // ── Conflict guard ──────────────────────────────────────────────────────
  // Check if any active appointment already occupies this slot
  const baseDate = new Date();
  const newStart = parse(data.time, 'HH:mm', baseDate);
  const newEnd = addMinutes(newStart, durationMinutes);

  const sameDay = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: data.date,
      status: { in: ['agendado', 'confirmado'] },
      OR: data.professionalId
        ? [{ professionalId: data.professionalId }, { professionalId: null }]
        : undefined,
    },
    select: { time: true, durationMinutes: true, professionalId: true },
  });

  for (const existing of sameDay) {
    if (!existing.time) continue;
    const exStart = parse(existing.time, 'HH:mm', baseDate);
    const exEnd = addMinutes(exStart, existing.durationMinutes ?? durationMinutes);
    // Overlap: newStart < exEnd && newEnd > exStart. If the new booking is
    // assigned to a professional, only that professional's agenda plus global
    // unassigned blocks are considered. Unassigned bookings keep blocking the
    // tenant-level agenda to preserve legacy behaviour.
    if (isBefore(newStart, exEnd) && isAfter(newEnd, exStart)) {
      throw new Error('Este horário já está ocupado. Por favor, escolha outro horário.');
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      customerPhone: data.phone,
      customerName: data.customerName,
      service: data.service,
      date: data.date,
      time: data.time,
      notes: data.notes,
      durationMinutes,          // snapshot at booking time
      status: 'agendado',       // FIX C3: was 'scheduled' (English), now matches schema
      source: data.source ?? 'manual',
      conversationId: data.conversationId ?? null,
      professionalId: data.professionalId ?? null,
      professionalName: data.professionalName ?? null,
    },
  });

  // Sync contact and link to appointment — functional, not just structural
  upsertContactByPhone({
    tenantId,
    phone: data.phone,
    name: data.customerName,
    source: data.source ?? 'manual',
    channel: data.source,
  })
    .then((contact) => {
      if (contact) {
        prisma.appointment
          .update({ where: { id: appointment.id }, data: { contactId: contact.id } })
          .then(() =>
            addContactEvent(
              tenantId,
              contact.id,
              'appointment_created',
              `Agendamento criado: ${data.service} em ${data.date} às ${data.time}`,
              { appointmentId: appointment.id, service: data.service, date: data.date, time: data.time }
            )
          )
          .catch((err) =>
            console.error('[ContactSync] Failed to link appointment to contact', {
              tenantId,
              appointmentId: appointment.id,
              contactId: contact.id,
              error: err?.message ?? err,
            })
          );
      }
    })
    .catch((err) =>
      console.error('[ContactSync] Failed to upsert contact from appointment', {
        tenantId,
        phone: data.phone,
        error: err?.message ?? err,
      })
    );

  return appointment;
}

// ─── Availability engine ─────────────────────────────────────────────────────

/**
 * Returns available HH:MM slots for a given tenant, date, and service.
 *
 * Rules applied:
 * 1. BusinessConfig.openingHours window
 * 2. BusinessConfig.closedWeekdays — skip entire day
 * 3. AvailabilityBlock — full-day and partial blocks
 * 4. Slot stride = BusinessConfig.slotStrideMinutes || service.durationMinutes
 * 5. Per-service bufferBefore/bufferAfter + global bufferBetween
 * 6. Existing appointments occupy their stored durationMinutes (fallback to service duration)
 * 7. Past slots are filtered when date == today (uses BusinessConfig.timezone)
 */
export async function getAvailableSlots(
  tenantId: string,
  date: string,
  serviceName: string,
  professionalId?: string  // AG5: filter to specific professional
): Promise<string[]> {
  // ── Load service ──────────────────────────────────────────────────────
  const service = await prisma.service.findFirst({
    where: { tenantId, name: { equals: serviceName, mode: 'insensitive' }, active: true },
  });
  if (!service) throw new Error('Serviço não encontrado ou inativo.');

  const serviceDuration = service.durationMinutes ?? 30;
  const bufferBefore = service.bufferBeforeMinutes ?? 0;
  const bufferAfter = service.bufferAfterMinutes ?? 0;

  // ── AG5: Load professional if specified ───────────────────────────────
  let professional: { openingHours: string | null; closedWeekdays: string } | null = null;
  if (professionalId) {
    professional = await prisma.professional.findUnique({
      where: { id: professionalId, tenantId },
      select: { openingHours: true, closedWeekdays: true },
    });
  }

  // ── Load business config ──────────────────────────────────────────────
  const config = await prisma.businessConfig.findUnique({ where: { tenantId } });
  // Professional hours override business config hours if set
  const openingHours = professional?.openingHours ?? config?.openingHours ?? '09:00 - 18:00';
  const timezone = config?.timezone ?? 'America/Sao_Paulo';
  const bufferBetween = config?.bufferBetweenMinutes ?? 0;
  // Stride: how far apart slots are offered. Default = service duration (non-overlapping)
  const stride = config?.slotStrideMinutes && config.slotStrideMinutes > 0
    ? config.slotStrideMinutes
    : serviceDuration;

  // Merge global + professional closed weekdays
  const globalClosed = (config?.closedWeekdays ?? '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const professionalClosed = professional
    ? (professional.closedWeekdays ?? '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : [];
  const closedWeekdays = [...new Set([...globalClosed, ...professionalClosed])];

  // ── Closed weekday check ──────────────────────────────────────────────
  // Use noon to avoid TZ edge cases in getDay()
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  if (closedWeekdays.includes(dayOfWeek)) return [];

  // ── AvailabilityBlocks ────────────────────────────────────────────────
  const blocks = await prisma.availabilityBlock.findMany({
    where: { tenantId, date },
  });
  if (blocks.some((b) => !b.startTime && !b.endTime)) return []; // full-day block

  // ── Parse opening hours ───────────────────────────────────────────────
  const parts = openingHours.split('-').map((s) => s.trim());
  if (parts.length < 2) throw new Error('Horário de funcionamento não configurado corretamente.');
  const [startHourStr, endHourStr] = parts;

  const base = new Date(); // used only as date-fns base for time parsing
  const openStart = parse(startHourStr, 'HH:mm', base);
  const openEnd = parse(endHourStr, 'HH:mm', base);

  // ── Existing appointments that day (AG5: filter by professional if given) ──
  const existingAppts = await prisma.appointment.findMany({
    where: {
      tenantId,
      date,
      status: { in: ['agendado', 'confirmado'] },
      ...(professionalId ? { professionalId } : {}),
    },
    select: { time: true, durationMinutes: true },
  });

  // ── Current time for "today" filtering ───────────────────────────────
  const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const todayInTz = format(nowInTz, 'yyyy-MM-dd');
  const isToday = date === todayInTz;

  // ── Slot generation ───────────────────────────────────────────────────
  const slots: string[] = [];
  let cursor = openStart;

  while (isBefore(cursor, openEnd)) {
    const slotStart = cursor;
    // Effective window this slot occupies: bufferBefore + serviceDuration + bufferAfter + bufferBetween
    const effectiveDuration = bufferBefore + serviceDuration + bufferAfter + bufferBetween;
    const slotEffectiveEnd = addMinutes(slotStart, effectiveDuration);

    // Slot must end within opening hours
    if (!isBefore(slotEffectiveEnd, openEnd) && slotEffectiveEnd > openEnd) {
      cursor = addMinutes(cursor, stride);
      continue;
    }

    const slotStartStr = format(slotStart, 'HH:mm');

    // Skip past slots (today only)
    if (isToday && !isAfter(parse(slotStartStr, 'HH:mm', nowInTz), nowInTz)) {
      cursor = addMinutes(cursor, stride);
      continue;
    }

    // Check partial-day blocks
    const blockedByWindow = blocks.some((b) => {
      if (!b.startTime || !b.endTime) return false;
      const bStart = parse(b.startTime, 'HH:mm', base);
      const bEnd = parse(b.endTime, 'HH:mm', base);
      // Slot overlaps block window
      return isBefore(slotStart, bEnd) && isAfter(addMinutes(slotStart, serviceDuration), bStart);
    });
    if (blockedByWindow) {
      cursor = addMinutes(cursor, stride);
      continue;
    }

    // Check overlap with existing appointments
    const hasConflict = existingAppts.some((appt) => {
      if (!appt.time) return false;
      const apptStart = parse(appt.time, 'HH:mm', base);
      // Existing appt occupies: apptStart to apptStart + apptDuration + bufferAfter + bufferBetween
      const apptEffectiveEnd = addMinutes(
        apptStart,
        (appt.durationMinutes ?? serviceDuration) + bufferAfter + bufferBetween
      );
      // New slot occupies: slotStart to slotEffectiveEnd
      return isBefore(slotStart, apptEffectiveEnd) && isAfter(slotEffectiveEnd, apptStart);
    });

    if (!hasConflict) slots.push(slotStartStr);

    cursor = addMinutes(cursor, stride);
  }

  return slots;
}

// ─── AG4: Safe reschedule ─────────────────────────────────────────────────────

/**
 * Moves an appointment to a new date/time after verifying no conflict.
 * Resets confirmation and reminder flags so notifications fire again for the new slot.
 * Throws if the new slot is occupied or the appointment doesn't belong to the tenant.
 */
export async function rescheduleAppointment(
  tenantId: string,
  appointmentId: string,
  newDate: string,
  newTime: string
) {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId, tenantId },
  });
  if (!existing) throw new Error('Agendamento não encontrado.');
  if (!['agendado', 'confirmado'].includes(existing.status)) {
    throw new Error('Apenas agendamentos ativos podem ser remarcados.');
  }

  const service = await prisma.service.findFirst({
    where: { tenantId, name: { equals: existing.service ?? '', mode: 'insensitive' }, active: true },
  });
  const durationMinutes = service?.durationMinutes ?? existing.durationMinutes ?? 30;

  // Conflict check — exclude the appointment being rescheduled
  const baseDate = new Date();
  const newStart = parse(newTime, 'HH:mm', baseDate);
  const newEnd = addMinutes(newStart, durationMinutes);

  const sameDay = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: newDate,
      status: { in: ['agendado', 'confirmado'] },
      id: { not: appointmentId },
      OR: existing.professionalId
        ? [{ professionalId: existing.professionalId }, { professionalId: null }]
        : undefined,
    },
    select: { time: true, durationMinutes: true, professionalId: true },
  });

  for (const appt of sameDay) {
    if (!appt.time) continue;
    const apptStart = parse(appt.time, 'HH:mm', baseDate);
    const apptEnd = addMinutes(apptStart, appt.durationMinutes ?? durationMinutes);
    if (isBefore(newStart, apptEnd) && isAfter(newEnd, apptStart)) {
      throw new Error('Este horário já está ocupado. Por favor, escolha outro horário.');
    }
  }

  return prisma.appointment.update({
    where: { id: appointmentId, tenantId },
    data: {
      date: newDate,
      time: newTime,
      status: 'agendado',
      confirmedAt: null,
      confirmationReceivedAt: null,
      reminderSentAt: null, // reset so reminders fire again for new date
    },
  });
}

// ─── AG4: Cancel with reason ──────────────────────────────────────────────────

export async function cancelAppointment(
  tenantId: string,
  appointmentId: string,
  reason?: string
) {
  return prisma.appointment.update({
    where: { id: appointmentId, tenantId },
    data: {
      status: 'cancelado',
      cancelledAt: new Date(),
      cancelReason: reason ?? null,
    },
  });
}

// ─── AG2: Next available slots across days ───────────────────────────────────

/**
 * Returns the next `count` available slots starting from `fromDate`.
 * Looks ahead up to 30 days. Used by the conversational booking flow.
 */
export async function suggestNextSlots(
  tenantId: string,
  serviceName: string,
  fromDate: string, // YYYY-MM-DD
  count = 5,
  professionalId?: string  // AG5: filter to specific professional
): Promise<Array<{ date: string; time: string; professionalId?: string; professionalName?: string }>> {
  const results: Array<{ date: string; time: string; professionalId?: string; professionalName?: string }> = [];
  const MAX_DAYS_AHEAD = 30;

  let base: Date;
  try {
    const [y, m, d] = fromDate.split('-').map(Number);
    base = new Date(y, m - 1, d);
  } catch {
    return results;
  }

  // AG5: If no specific professional, check if service has professionals assigned
  // Auto-assign: collect slots across all assigned professionals, return earliest N
  if (!professionalId) {
    const service = await prisma.service.findFirst({
      where: { tenantId, name: { equals: serviceName, mode: 'insensitive' }, active: true },
      include: {
        professionals: {
          include: { professional: { select: { id: true, name: true, active: true } } },
        },
      },
    });
    const activeProfessionals = service?.professionals
      .map(ps => ps.professional)
      .filter(p => p.active) ?? [];

    if (activeProfessionals.length > 0) {
      // Collect slots from all professionals, sort by date+time, take first N
      const allSlots: Array<{ date: string; time: string; professionalId: string; professionalName: string }> = [];
      for (const prof of activeProfessionals) {
        for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
          const dateStr = format(addDays(base, i), 'yyyy-MM-dd');
          try {
            const slots = await getAvailableSlots(tenantId, dateStr, serviceName, prof.id);
            for (const time of slots) {
              allSlots.push({ date: dateStr, time, professionalId: prof.id, professionalName: prof.name });
            }
          } catch { /* skip */ }
        }
      }
      allSlots.sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`).getTime();
        const db = new Date(`${b.date}T${b.time}`).getTime();
        return da - db;
      });
      return allSlots.slice(0, count);
    }
  }

  // No professionals assigned — use global availability
  for (let i = 0; i < MAX_DAYS_AHEAD && results.length < count; i++) {
    const day = addDays(base, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    try {
      const slots = await getAvailableSlots(tenantId, dateStr, serviceName, professionalId);
      for (const time of slots) {
        if (results.length >= count) break;
        results.push({ date: dateStr, time, professionalId, professionalName: undefined });
      }
    } catch {
      break;
    }
  }

  return results;
}

// ─── Availability Blocks ──────────────────────────────────────────────────────

export async function getAvailabilityBlocks(tenantId: string, date?: string) {
  return prisma.availabilityBlock.findMany({
    where: { tenantId, ...(date ? { date } : {}) },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
}

export async function createAvailabilityBlock(
  tenantId: string,
  data: { date: string; startTime?: string; endTime?: string; reason?: string }
) {
  return prisma.availabilityBlock.create({
    data: { tenantId, ...data },
  });
}

export async function deleteAvailabilityBlock(tenantId: string, id: string) {
  return prisma.availabilityBlock.delete({ where: { id, tenantId } });
}
