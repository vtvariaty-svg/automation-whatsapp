/**
 * AG3 — Confirmations, Reminders and No-Show Prevention
 *
 * Handles:
 * - Immediate booking confirmation after scheduling
 * - 24h reminder with confirmation request
 * - 2h reminder
 * - Automatic no-show detection (appointments past their time)
 * - No-show follow-up (rebooking nudge)
 * - Full notification history via AppointmentNotification
 */

import { prisma } from '@/lib/prisma';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { decrypt } from '@/lib/utils/crypto';
// @ts-ignore
import { sendWhatsAppMessage } from './whatsappService';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function sendTemplateHelper(
  phone: string,
  templateName: string,
  variables: Record<string, string>,
  wa: TenantWhatsApp
): Promise<boolean> {
  try {
    const res = await fetch(`${APP_URL}/api/whatsapp/templates/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        templateName,
        language: "pt_BR",
        variables,
        tenantPhoneId: wa.phoneId,
        tenantToken: wa.token
      }),
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error(`[Template Delivery] Erro da API interna:`, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Template Delivery] Exceção:`, err);
    return false;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'booking_confirmed' | 'reminder_24h' | 'reminder_2h' | 'noshow_followup';

interface TenantWhatsApp {
  phoneId: string;
  token: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function logNotification(
  appointmentId: string,
  tenantId: string,
  type: NotificationType,
  status: 'sent' | 'failed',
  channel = 'whatsapp'
) {
  await prisma.appointmentNotification.create({
    data: { appointmentId, tenantId, type, channel, status },
  });
}

async function hasNotificationBeenSent(appointmentId: string, type: NotificationType): Promise<boolean> {
  const n = await prisma.appointmentNotification.findFirst({
    where: { appointmentId, type, status: 'sent' },
    select: { id: true },
  });
  return n !== null;
}

function extractTenantWhatsApp(tenant: {
  whatsappPhoneNumberId: string | null;
  whatsappPhoneId: string | null;
  whatsappToken: string | null;
}): TenantWhatsApp | null {
  const phoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
  if (!phoneId || !tenant.whatsappToken) return null;
  try {
    return { phoneId, token: decrypt(tenant.whatsappToken) };
  } catch {
    return null;
  }
}

async function trySendWhatsApp(
  phone: string,
  message: string,
  wa: TenantWhatsApp,
  appointmentId: string,
  tenantId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    await sendWhatsAppMessage(phone, message, wa.phoneId, wa.token);
    await logNotification(appointmentId, tenantId, type, 'sent');
    return true;
  } catch (e) {
    console.error(`[AppointmentNotif] Falha ao enviar ${type} para ${appointmentId}:`, e);
    await logNotification(appointmentId, tenantId, type, 'failed');
    return false;
  }
}

// ─── AG3: Booking confirmation ────────────────────────────────────────────────

/**
 * Sends an immediate confirmation message after a booking is created.
 * Called by the conversational booking flow after slot selection.
 * Fire-and-forget — caller should not await.
 */
export async function sendBookingConfirmation(tenantId: string, appointmentId: string): Promise<void> {
  if (await hasNotificationBeenSent(appointmentId, 'booking_confirmed')) return;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      tenant: {
        select: { 
          whatsappPhoneNumberId: true, 
          whatsappPhoneId: true, 
          whatsappToken: true,
          businessConfig: { select: { templateBookingConfirmed: true } }
        },
      },
    },
  });
  if (!appt || !appt.customerPhone) return;

  const wa = extractTenantWhatsApp(appt.tenant);
  if (!wa) return;

  const nameGreet = appt.customerName ? `, *${appt.customerName}*` : '';
  const serviceName = appt.service ?? 'serviço';
  const timeStr = appt.time ? `${appt.time}h` : 'a confirmar';
  const dayLabel = appt.date
    ? format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd 'de' MMMM", { locale: ptBR })
    : 'a confirmar';

  const templateName = appt.tenant?.businessConfig?.templateBookingConfirmed;

  if (templateName) {
    const variables: Record<string, string> = {
      // Mapeamento dinâmico comum para templates
      "1": appt.customerName || "Cliente",
      "2": serviceName,
      "3": dayLabel,
      "4": timeStr
    };
    const ok = await sendTemplateHelper(appt.customerPhone, templateName, variables, wa);
    if (ok) {
      await logNotification(appointmentId, tenantId, 'booking_confirmed', 'sent', 'whatsapp_template');
      return;
    }
    // Se falhar o template por algum motivo ou erro da Meta, faz fallback pro texto normal
  }

  const message = [
    `✅ *Agendamento confirmado${nameGreet}!*`,
    ``,
    `📋 *Serviço:* ${serviceName}`,
    `📅 *Data:* ${dayLabel}`,
    `🕐 *Horário:* ${timeStr}`,
    ``,
    `Enviaremos um lembrete antes do seu horário. Caso precise cancelar ou reagendar, é só nos avisar aqui! 😊`,
  ].join('\n');

  await trySendWhatsApp(appt.customerPhone, message, wa, appointmentId, tenantId, 'booking_confirmed');
}

// ─── AG3: 24h reminder with confirmation request ──────────────────────────────

export async function processReminders24h(): Promise<{ sent: number; errors: number }> {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const appointments = await prisma.appointment.findMany({
    where: {
      date: tomorrow,
      status: { in: ['agendado', 'confirmado'] },
      reminderSentAt: null,
    },
    include: {
      tenant: {
        select: { 
          whatsappPhoneNumberId: true, 
          whatsappPhoneId: true, 
          whatsappToken: true,
          businessConfig: { select: { templateReminder24h: true } }
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const appt of appointments) {
    if (!appt.customerPhone) continue;
    const wa = extractTenantWhatsApp(appt.tenant);
    if (!wa) continue;

    const nameGreet = appt.customerName ? `, *${appt.customerName}*` : '';
    const serviceName = appt.service ?? 'seu serviço';
    const timeStr = appt.time ? `${appt.time}h` : 'horário a confirmar';
    const dayLabel = format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd 'de' MMMM", { locale: ptBR });

    // Include confirmation request only if not yet confirmed
    const confirmLine = appt.confirmationReceivedAt
      ? `Presença já confirmada ✅`
      : `Responda *SIM* para confirmar sua presença.`;

    const templateName = appt.tenant?.businessConfig?.templateReminder24h;
    let ok = false;
    
    if (templateName) {
      const variables: Record<string, string> = {
        "1": appt.customerName || "Cliente",
        "2": serviceName,
        "3": dayLabel,
        "4": timeStr
      };
      ok = await sendTemplateHelper(appt.customerPhone, templateName, variables, wa);
      if (ok) {
        await logNotification(appt.id, appt.tenantId, 'reminder_24h', 'sent', 'whatsapp_template');
      }
    }

    if (!ok) {
      const message = [
        `🔔 *Lembrete de agendamento*`,
        ``,
        `Olá${nameGreet}! Você tem um agendamento *amanhã*:`,
        ``,
        `📋 *Serviço:* ${serviceName}`,
        `📅 *Data:* ${dayLabel}`,
        `🕐 *Horário:* ${timeStr}`,
        ``,
        confirmLine,
        `Caso precise cancelar ou reagendar, é só nos avisar aqui! 😊`,
      ].join('\n');

      ok = await trySendWhatsApp(appt.customerPhone, message, wa, appt.id, appt.tenantId, 'reminder_24h');
    }
    if (ok) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } else {
      errors++;
    }
  }

  return { sent, errors };
}

// ─── AG3: 2h reminder ─────────────────────────────────────────────────────────

export async function processReminders2h(): Promise<{ sent: number; errors: number }> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const nowUTC = new Date();
  const nowMinutes = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes();

  // Target: appointments 1h30m–2h30m from now (generous window for UTC ± Brazil offset)
  const windowStart = nowMinutes + 90;
  const windowEnd = nowMinutes + 150;

  const appointments = await prisma.appointment.findMany({
    where: {
      date: today,
      status: { in: ['agendado', 'confirmado'] },
    },
    include: {
      tenant: {
        select: { 
          whatsappPhoneNumberId: true, 
          whatsappPhoneId: true, 
          whatsappToken: true,
          businessConfig: { select: { templateReminder2h: true } }
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const appt of appointments) {
    if (!appt.customerPhone || !appt.time) continue;

    // Parse appointment time as minutes-of-day
    const [h, m] = appt.time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;
    const apptMinutes = h * 60 + m;

    // Check if appointment falls in the 2h window
    if (apptMinutes < windowStart || apptMinutes > windowEnd) continue;

    // Skip if 2h reminder already sent
    if (await hasNotificationBeenSent(appt.id, 'reminder_2h')) continue;

    const wa = extractTenantWhatsApp(appt.tenant);
    if (!wa) continue;

    const nameGreet = appt.customerName ? `, *${appt.customerName}*` : '';
    const serviceName = appt.service ?? 'seu serviço';
    const confirmLine = appt.confirmationReceivedAt
      ? `Presença confirmada ✅`
      : `Responda *SIM* para confirmar sua presença.`;

    const templateName = appt.tenant?.businessConfig?.templateReminder2h;
    let ok = false;
    
    if (templateName) {
      const dayLabel = format(new Date(`${appt.date}T12:00:00`), "EEEE',' dd 'de' MMMM", { locale: ptBR });
      const variables: Record<string, string> = {
        "1": appt.customerName || "Cliente",
        "2": serviceName,
        "3": dayLabel,
        "4": `${appt.time}h`
      };
      ok = await sendTemplateHelper(appt.customerPhone, templateName, variables, wa);
      if (ok) {
        await logNotification(appt.id, appt.tenantId, 'reminder_2h', 'sent', 'whatsapp_template');
      }
    }

    if (!ok) {
      const message = [
        `⏰ *Lembrete: seu horário é em breve!*`,
        ``,
        `Olá${nameGreet}! Passando para lembrar que seu agendamento é *hoje às ${appt.time}h*:`,
        ``,
        `📋 *Serviço:* ${serviceName}`,
        ``,
        confirmLine,
        `Até logo! 😊`,
      ].join('\n');

      ok = await trySendWhatsApp(appt.customerPhone, message, wa, appt.id, appt.tenantId, 'reminder_2h');
    }
    if (ok) sent++;
    else errors++;
  }

  return { sent, errors };
}

// ─── AG3: No-show detection ───────────────────────────────────────────────────

/**
 * Marks appointments as no_show when their date has passed and they are still
 * in agendado/confirmado status.
 * Conservative: only marks if the appointment date is strictly before today (UTC).
 * Same-day no-shows are handled manually by the operator or by the 2h-reminder + confirmation flow.
 */
export async function processNoShowDetection(): Promise<{ marked: number }> {
  const today = format(new Date(), 'yyyy-MM-dd');

  const overdue = await prisma.appointment.findMany({
    where: {
      date: { lt: today },
      status: { in: ['agendado', 'confirmado'] },
    },
    select: { id: true, tenantId: true },
  });

  if (overdue.length === 0) return { marked: 0 };

  await prisma.appointment.updateMany({
    where: { id: { in: overdue.map(a => a.id) } },
    data: { status: 'no_show', cancelledAt: new Date() },
  });

  console.log(`[NoShowDetection] ${overdue.length} agendamento(s) marcado(s) como no_show`);
  return { marked: overdue.length };
}

// ─── AG3: No-show follow-up ───────────────────────────────────────────────────

/**
 * Sends a rebooking nudge to customers who were marked no_show
 * and haven't received a follow-up yet.
 */
export async function processNoShowFollowUps(): Promise<{ sent: number; errors: number }> {
  // Find recent no-shows (last 3 days) without a follow-up notification
  const cutoff = format(addDays(new Date(), -3), 'yyyy-MM-dd');

  const noShows = await prisma.appointment.findMany({
    where: {
      status: 'no_show',
      date: { gte: cutoff },
    },
    include: {
      tenant: {
        select: { whatsappPhoneNumberId: true, whatsappPhoneId: true, whatsappToken: true },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const appt of noShows) {
    if (!appt.customerPhone) continue;

    // Skip if follow-up already sent
    if (await hasNotificationBeenSent(appt.id, 'noshow_followup')) continue;

    const wa = extractTenantWhatsApp(appt.tenant);
    if (!wa) continue;

    const nameGreet = appt.customerName ? `, *${appt.customerName}*` : '';
    const serviceName = appt.service ?? 'seu serviço';

    const message = [
      `Olá${nameGreet}! 👋`,
      ``,
      `Notamos que você não compareceu ao seu agendamento de *${serviceName}*.`,
      ``,
      `Gostaríamos de te ajudar a remarcar! Quando seria um bom horário para você?`,
      ``,
      `Basta responder aqui para verificar a disponibilidade. 📅`,
    ].join('\n');

    const ok = await trySendWhatsApp(appt.customerPhone, message, wa, appt.id, appt.tenantId, 'noshow_followup');
    if (ok) sent++;
    else errors++;
  }

  return { sent, errors };
}

// ─── Legacy alias (AG2 compat) ────────────────────────────────────────────────

/** @deprecated Use processReminders24h instead */
export const processAppointmentReminders = processReminders24h;
