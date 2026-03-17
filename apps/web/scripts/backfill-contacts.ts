/**
 * backfill-contacts.ts
 *
 * Backfill phase 1: creates Contact records from existing data.
 *
 * Priority order (best data first):
 * 1. CustomerMemory  — has name + preferences
 * 2. Conversation    — has phone + channel
 * 3. Order           — has phone + customerName
 * 4. Appointment     — has phone + customerName
 *
 * SalesOpportunity, LeadAttribution, ConversionLead → phase 2
 * (those use phone as pseudo-ID string, not always normalizable)
 *
 * Run: npx ts-node --project tsconfig.json scripts/backfill-contacts.ts
 *
 * Safe to re-run: upserts on [tenantId, normalizedPhone] are idempotent.
 */

import { PrismaClient } from '@prisma/client';

// Inline normalizePhone to avoid import issues in ts-node context
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits.length >= 8 ? digits : null;
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  // ── 1. CustomerMemory (best source: name + notes) ─────────────────────────
  console.log('Processing CustomerMemory...');
  const memories = await prisma.customerMemory.findMany({
    select: { id: true, tenantId: true, contactId: true, name: true },
  });

  for (const mem of memories) {
    const normalizedPhone = normalizePhone(mem.contactId);
    if (!normalizedPhone) { skipped++; continue; }

    const contact = await prisma.contact.upsert({
      where: { tenantId_normalizedPhone: { tenantId: mem.tenantId, normalizedPhone } },
      update: { name: mem.name ?? undefined, updatedAt: new Date() },
      create: {
        tenantId: mem.tenantId,
        phone: mem.contactId,
        normalizedPhone,
        name: mem.name ?? null,
        source: 'whatsapp',
        status: 'active',
      },
      select: { id: true },
    });

    // Link CustomerMemory → Contact
    await prisma.customerMemory.update({
      where: { id: mem.id },
      data: { realContactId: contact.id },
    }).catch(() => {}); // may already be set if ran before

    created++;
  }
  console.log(`CustomerMemory: processed ${memories.length}, created/updated ${created}, skipped ${skipped}`);

  // ── 2. Conversation ────────────────────────────────────────────────────────
  console.log('Processing Conversations...');
  let convCount = 0; let convSkip = 0;

  const conversations = await prisma.conversation.findMany({
    where: { contactId: null },
    select: { id: true, tenantId: true, customerPhone: true, channel: true, lastMessageAt: true },
    orderBy: { lastMessageAt: 'desc' },
  });

  for (const conv of conversations) {
    const normalizedPhone = normalizePhone(conv.customerPhone);
    if (!normalizedPhone) { convSkip++; continue; }

    const contact = await prisma.contact.upsert({
      where: { tenantId_normalizedPhone: { tenantId: conv.tenantId, normalizedPhone } },
      update: {
        lastInteractionAt: conv.lastMessageAt,
        lastChannelUsed: conv.channel,
        updatedAt: new Date(),
      },
      create: {
        tenantId: conv.tenantId,
        phone: conv.customerPhone,
        normalizedPhone,
        source: conv.channel ?? 'whatsapp',
        lastChannelUsed: conv.channel,
        lastInteractionAt: conv.lastMessageAt,
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { contactId: contact.id },
    });

    convCount++;
  }
  console.log(`Conversations: linked ${convCount}, skipped ${convSkip}`);

  // ── 3. Orders ─────────────────────────────────────────────────────────────
  console.log('Processing Orders...');
  let orderCount = 0; let orderSkip = 0;

  const orders = await prisma.order.findMany({
    where: { contactId: null },
    select: { id: true, tenantId: true, customerPhone: true, customerName: true, origin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  for (const order of orders) {
    const normalizedPhone = normalizePhone(order.customerPhone);
    if (!normalizedPhone) { orderSkip++; continue; }

    const contact = await prisma.contact.upsert({
      where: { tenantId_normalizedPhone: { tenantId: order.tenantId, normalizedPhone } },
      update: {
        name: order.customerName ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        tenantId: order.tenantId,
        phone: order.customerPhone,
        normalizedPhone,
        name: order.customerName ?? null,
        source: order.origin ?? 'order',
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { contactId: contact.id },
    });

    orderCount++;
  }
  console.log(`Orders: linked ${orderCount}, skipped ${orderSkip}`);

  // ── 4. Appointments ────────────────────────────────────────────────────────
  console.log('Processing Appointments...');
  let apptCount = 0; let apptSkip = 0;

  const appointments = await prisma.appointment.findMany({
    where: { contactId: null },
    select: { id: true, tenantId: true, customerPhone: true, customerName: true, source: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  for (const appt of appointments) {
    const normalizedPhone = normalizePhone(appt.customerPhone);
    if (!normalizedPhone) { apptSkip++; continue; }

    const contact = await prisma.contact.upsert({
      where: { tenantId_normalizedPhone: { tenantId: appt.tenantId, normalizedPhone } },
      update: {
        name: appt.customerName ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        tenantId: appt.tenantId,
        phone: appt.customerPhone,
        normalizedPhone,
        name: appt.customerName ?? null,
        source: appt.source ?? 'appointment',
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.appointment.update({
      where: { id: appt.id },
      data: { contactId: contact.id },
    });

    apptCount++;
  }
  console.log(`Appointments: linked ${apptCount}, skipped ${apptSkip}`);

  console.log('\n=== Backfill complete ===');
  console.log(`CustomerMemory contacts: ${created} processed, ${skipped} skipped (unnormalizable phone)`);
  console.log(`Conversations linked:    ${convCount} (${convSkip} skipped)`);
  console.log(`Orders linked:           ${orderCount} (${orderSkip} skipped)`);
  console.log(`Appointments linked:     ${apptCount} (${apptSkip} skipped)`);
  console.log('\nPhase 2 (not covered): SalesOpportunity, LeadAttribution, ConversionLead');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
