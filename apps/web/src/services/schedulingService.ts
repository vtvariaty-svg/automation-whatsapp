import { prisma } from '@/lib/prisma';
import { parse, addMinutes, isBefore, isAfter, isEqual, startOfDay, endOfDay, format } from 'date-fns';

export async function getServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createService(tenantId: string, data: any) {
  return prisma.service.create({
    data: {
      tenantId,
      name: data.name,
      durationMinutes: data.durationMinutes,
      active: data.active ?? true,
    }
  });
}

export async function updateService(tenantId: string, id: string, data: any) {
  return prisma.service.update({
    where: { id, tenantId },
    data
  });
}

export async function deleteService(tenantId: string, id: string) {
  return prisma.service.delete({
    where: { id, tenantId }
  });
}

export async function getAppointments(tenantId: string) {
  return prisma.appointment.findMany({
    where: { tenantId },
    orderBy: [
      { date: 'desc' },
      { time: 'desc' }
    ]
  });
}

export async function updateAppointmentStatus(tenantId: string, id: string, status: string) {
  return prisma.appointment.update({
    where: { id, tenantId },
    data: { status }
  });
}

export async function createAppointment(tenantId: string, data: { phone: string, customerName?: string, service: string, date: string, time: string }) {
  return prisma.appointment.create({
    data: {
      tenantId,
      customerPhone: data.phone,
      customerName: data.customerName,
      service: data.service,
      date: data.date,
      time: data.time,
      status: 'scheduled'
    }
  });
}

export async function getAvailableSlots(tenantId: string, date: string, serviceName: string) {
  // Find the service duration
  const service = await prisma.service.findFirst({
    where: { tenantId, name: { equals: serviceName, mode: 'insensitive' }, active: true }
  });

  if (!service) {
    throw new Error('Serviço não encontrado ou inativo.');
  }

  const duration = service.durationMinutes || 30;

  // Find business config / hours
  const businessConfig = await prisma.businessConfig.findUnique({
    where: { tenantId }
  });

  const openingHours = businessConfig?.openingHours || '09:00 - 18:00';
  const [startHourStr, endHourStr] = openingHours.split('-').map(s => s.trim());

  if (!startHourStr || !endHourStr) {
    throw new Error('Horário de funcionamento não configurado corretamente.');
  }

  const baseDate = new Date(); // Only using for time manipulation
  
  const startTime = parse(startHourStr, 'HH:mm', baseDate);
  const endTime = parse(endHourStr, 'HH:mm', baseDate);

  // Fetch appointments for this day
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date,
      status: { in: ['scheduled', 'confirmed'] }
    }
  });

  // Calculate available slots
  let currentSlot = startTime;
  const availableSlots: string[] = [];

  while (isBefore(currentSlot, endTime) || isEqual(currentSlot, endTime)) {
    const slotEnd = addMinutes(currentSlot, duration);
    if (isAfter(slotEnd, endTime)) {
      break; // Doesn't fit before closing
    }

    const slotStartStr = format(currentSlot, 'HH:mm');
    const slotEndStr = format(slotEnd, 'HH:mm');

    // Check if slot overlaps with any existing appointment
    const hasOverlap = appointments.some(app => {
        if (!app.time) return false;
        
        // Let's assume an appointment takes its own service duration, but we might not have it strictly saved in appointment.
        // For simplicity, we assume an existing appointment starts at app.time and takes roughly 30-60m or the same duration.
        // In a robust system, Appointment should save its end_time or duration. We will assume standard duration.
        const appStart = parse(app.time, 'HH:mm', baseDate);
        const appEnd = addMinutes(appStart, duration); // Assuming all services take approx same or we'd fetch duration.
        
        // Overlap condition:
        // currentSlot < appEnd && slotEnd > appStart
        return isBefore(currentSlot, appEnd) && isAfter(slotEnd, appStart);
    });

    if (!hasOverlap) {
      availableSlots.push(slotStartStr);
    }

    // Move to next potential slot (e.g., every 30 mins)
    currentSlot = addMinutes(currentSlot, 30);
  }

  return availableSlots;
}
