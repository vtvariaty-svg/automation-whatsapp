import { prisma } from '@/lib/prisma';
import { parse, addMinutes, isBefore, isAfter, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAppointmentData {
  phone: string;
  customerName?: string;
  service: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  notes?: string;
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

  return prisma.appointment.update({
    where: { id, tenantId },
    data: { status, ...timestamps },
  });
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
    },
    select: { time: true, durationMinutes: true },
  });

  for (const existing of sameDay) {
    if (!existing.time) continue;
    const exStart = parse(existing.time, 'HH:mm', baseDate);
    const exEnd = addMinutes(exStart, existing.durationMinutes ?? durationMinutes);
    // Overlap: newStart < exEnd && newEnd > exStart
    if (isBefore(newStart, exEnd) && isAfter(newEnd, exStart)) {
      throw new Error('Este horário já está ocupado. Por favor, escolha outro horário.');
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  return prisma.appointment.create({
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
    },
  });
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
  serviceName: string
): Promise<string[]> {
  // ── Load service ──────────────────────────────────────────────────────
  const service = await prisma.service.findFirst({
    where: { tenantId, name: { equals: serviceName, mode: 'insensitive' }, active: true },
  });
  if (!service) throw new Error('Serviço não encontrado ou inativo.');

  const serviceDuration = service.durationMinutes ?? 30;
  const bufferBefore = service.bufferBeforeMinutes ?? 0;
  const bufferAfter = service.bufferAfterMinutes ?? 0;

  // ── Load business config ──────────────────────────────────────────────
  const config = await prisma.businessConfig.findUnique({ where: { tenantId } });
  const openingHours = config?.openingHours ?? '09:00 - 18:00';
  const timezone = config?.timezone ?? 'America/Sao_Paulo';
  const bufferBetween = config?.bufferBetweenMinutes ?? 0;
  // Stride: how far apart slots are offered. Default = service duration (non-overlapping)
  const stride = config?.slotStrideMinutes && config.slotStrideMinutes > 0
    ? config.slotStrideMinutes
    : serviceDuration;

  const closedWeekdays = (config?.closedWeekdays ?? '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

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

  // ── Existing appointments that day ────────────────────────────────────
  const existingAppts = await prisma.appointment.findMany({
    where: {
      tenantId,
      date,
      status: { in: ['agendado', 'confirmado'] },
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
