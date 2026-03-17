import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils/normalizePhone';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertContactInput {
  tenantId: string;
  phone?: string;
  name?: string;
  email?: string;
  source?: string;
  channel?: string;
  waId?: string;
  instagramScopedId?: string;
  facebookScopedId?: string;
}

export interface ListContactsOptions {
  search?: string;
  source?: string;
  channel?: string;
  status?: string;
  tag?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

/**
 * Creates or updates a Contact for a given tenant + phone.
 * Safe to call concurrently — uses upsert on [tenantId, normalizedPhone].
 * Returns the Contact, or null if phone cannot be normalized.
 */
export async function upsertContactByPhone(
  input: UpsertContactInput
): Promise<{ id: string } | null> {
  const normalizedPhone = normalizePhone(input.phone ?? null);

  if (!normalizedPhone) {
    // Cannot deduplicate without a normalizable phone — skip silently
    return null;
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    lastInteractionAt: now,
    updatedAt: now,
  };
  if (input.name) updateData.name = input.name;
  if (input.channel) updateData.lastChannelUsed = input.channel;
  if (input.waId) updateData.waId = input.waId;
  if (input.instagramScopedId) updateData.instagramScopedId = input.instagramScopedId;
  if (input.facebookScopedId) updateData.facebookScopedId = input.facebookScopedId;
  if (input.email) updateData.email = input.email;

  const contact = await prisma.contact.upsert({
    where: {
      tenantId_normalizedPhone: {
        tenantId: input.tenantId,
        normalizedPhone,
      },
    },
    update: updateData,
    create: {
      tenantId: input.tenantId,
      phone: input.phone ?? normalizedPhone,
      normalizedPhone,
      name: input.name ?? null,
      email: input.email ?? null,
      source: input.source ?? input.channel ?? 'whatsapp',
      lastChannelUsed: input.channel ?? null,
      lastInteractionAt: now,
      waId: input.waId ?? null,
      instagramScopedId: input.instagramScopedId ?? null,
      facebookScopedId: input.facebookScopedId ?? null,
      status: 'active',
    },
    select: { id: true },
  });

  return contact;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listContacts(
  tenantId: string,
  opts: ListContactsOptions = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };

  if (opts.status) where.status = opts.status;
  if (opts.source) where.source = opts.source;
  if (opts.channel) where.lastChannelUsed = opts.channel;
  if (opts.tag) where.tags = { has: opts.tag };

  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { phone: { contains: opts.search, mode: 'insensitive' } },
      { normalizedPhone: { contains: opts.search } },
      { email: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  if (opts.createdFrom || opts.createdTo) {
    const createdAt: Record<string, Date> = {};
    if (opts.createdFrom) createdAt.gte = new Date(opts.createdFrom);
    if (opts.createdTo) createdAt.lte = new Date(opts.createdTo);
    where.createdAt = createdAt;
  }

  const [total, items] = await Promise.all([
    prisma.contact.count({ where: where as any }),
    prisma.contact.findMany({
      where: where as any,
      orderBy: { lastInteractionAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        normalizedPhone: true,
        email: true,
        status: true,
        source: true,
        lastChannelUsed: true,
        lastInteractionAt: true,
        createdAt: true,
        waId: true,
        instagramScopedId: true,
        facebookScopedId: true,
        tags: true,
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Get with history ────────────────────────────────────────────────────────

export async function getContactWithHistory(tenantId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    include: {
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 5,
        select: {
          id: true,
          channel: true,
          status: true,
          lastMessageAt: true,
          createdAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          price: true,
          currency: true,
          product: true,
          createdAt: true,
        },
      },
      appointments: {
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        take: 3,
        select: {
          id: true,
          service: true,
          date: true,
          time: true,
          status: true,
          createdAt: true,
        },
      },
      memory: {
        select: {
          preferences: true,
          notes: true,
          updatedAt: true,
        },
      },
    },
  });

  return contact;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateContactInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  notes?: string;
}

export async function updateContact(
  tenantId: string,
  contactId: string,
  data: UpdateContactInput
) {
  // If phone changed, re-normalize
  const updateData: Record<string, unknown> = { ...data };
  if (data.phone) {
    const normalizedPhone = normalizePhone(data.phone);
    if (normalizedPhone) updateData.normalizedPhone = normalizedPhone;
  }

  return prisma.contact.update({
    where: { id: contactId, tenantId },
    data: updateData as any,
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function updateContactTags(
  tenantId: string,
  contactId: string,
  tags: string[]
) {
  const cleaned = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  return prisma.contact.update({
    where: { id: contactId, tenantId },
    data: { tags: cleaned },
  });
}

// ─── Events (Timeline) ────────────────────────────────────────────────────────

export async function addContactEvent(
  tenantId: string,
  contactId: string,
  type: string,
  title: string,
  metadata?: Record<string, unknown>,
  occurredAt?: Date
) {
  return prisma.contactEvent.create({
    data: {
      tenantId,
      contactId,
      type,
      title,
      metadata: metadata ?? null,
      occurredAt: occurredAt ?? new Date(),
    },
  });
}

export async function getContactTimeline(tenantId: string, contactId: string) {
  return prisma.contactEvent.findMany({
    where: { tenantId, contactId },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  });
}

// ─── Deduplication ────────────────────────────────────────────────────────────

export async function findPotentialDuplicates(tenantId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: {
      normalizedPhone: true,
      email: true,
      waId: true,
      instagramScopedId: true,
      facebookScopedId: true,
    },
  });

  if (!contact) return [];

  const orConditions: any[] = [];
  if (contact.normalizedPhone) orConditions.push({ normalizedPhone: contact.normalizedPhone });
  if (contact.email) orConditions.push({ email: { equals: contact.email, mode: 'insensitive' } });
  if (contact.waId) orConditions.push({ waId: contact.waId });
  if (contact.instagramScopedId) orConditions.push({ instagramScopedId: contact.instagramScopedId });
  if (contact.facebookScopedId) orConditions.push({ facebookScopedId: contact.facebookScopedId });

  if (orConditions.length === 0) return [];

  return prisma.contact.findMany({
    where: {
      tenantId,
      id: { not: contactId },
      status: { not: 'archived' },
      OR: orConditions,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      normalizedPhone: true,
      email: true,
      status: true,
      source: true,
      lastInteractionAt: true,
      createdAt: true,
    },
    take: 10,
  });
}

// ─── Merge ────────────────────────────────────────────────────────────────────

/**
 * Merges mergedId into survivorId.
 * - Reassigns all conversations, orders, appointments linked to mergedId → survivorId
 * - Copies missing fields from merged into survivor (name, email, phone, channel IDs)
 * - Merges tags (union)
 * - Archives mergedId
 * - Writes audit record to ContactMerge
 * - Fires a contact_merged event on the survivor
 */
export async function mergeContacts(
  tenantId: string,
  survivorId: string,
  mergedId: string,
  userId?: string
) {
  if (survivorId === mergedId) throw new Error('Cannot merge a contact with itself');

  const [survivor, merged] = await Promise.all([
    prisma.contact.findFirst({ where: { id: survivorId, tenantId } }),
    prisma.contact.findFirst({ where: { id: mergedId, tenantId } }),
  ]);

  if (!survivor) throw new Error('Survivor contact not found');
  if (!merged) throw new Error('Merged contact not found');
  if (merged.status === 'archived') throw new Error('Contact is already archived');

  // Reassign all relational data
  await prisma.$transaction([
    prisma.conversation.updateMany({
      where: { contactId: mergedId, tenantId },
      data: { contactId: survivorId },
    }),
    prisma.order.updateMany({
      where: { contactId: mergedId, tenantId },
      data: { contactId: survivorId },
    }),
    prisma.appointment.updateMany({
      where: { contactId: mergedId, tenantId },
      data: { contactId: survivorId },
    }),
    prisma.contactEvent.updateMany({
      where: { contactId: mergedId, tenantId },
      data: { contactId: survivorId },
    }),
  ]);

  // Merge fields: fill survivor gaps with merged data
  const mergedTags = [...new Set([...(survivor.tags as string[]), ...(merged.tags as string[])])];
  const fillData: Record<string, unknown> = {
    tags: mergedTags,
    updatedAt: new Date(),
  };
  if (!survivor.name && merged.name) fillData.name = merged.name;
  if (!survivor.email && merged.email) fillData.email = merged.email;
  if (!survivor.waId && merged.waId) fillData.waId = merged.waId;
  if (!survivor.instagramScopedId && merged.instagramScopedId) fillData.instagramScopedId = merged.instagramScopedId;
  if (!survivor.facebookScopedId && merged.facebookScopedId) fillData.facebookScopedId = merged.facebookScopedId;

  await prisma.$transaction([
    // Update survivor
    prisma.contact.update({
      where: { id: survivorId },
      data: fillData as any,
    }),
    // Archive merged contact (clear normalizedPhone to free up unique constraint)
    prisma.contact.update({
      where: { id: mergedId },
      data: { status: 'archived', normalizedPhone: null, updatedAt: new Date() },
    }),
    // Audit record
    prisma.contactMerge.create({
      data: { tenantId, survivorId, mergedId, mergedBy: userId ?? null },
    }),
  ]);

  // Timeline event (non-blocking)
  addContactEvent(
    tenantId,
    survivorId,
    'contact_merged',
    `Contato mesclado com ${merged.name ?? merged.phone ?? mergedId}`,
    { mergedId, mergedBy: userId }
  ).catch(() => {});

  return { survivorId, mergedId };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getContactAnalytics(tenantId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    total,
    newThisWeek,
    withOrders,
    withAppointments,
    bySource,
    byStatus,
    mergeCount,
  ] = await Promise.all([
    prisma.contact.count({ where: { tenantId } }),
    prisma.contact.count({ where: { tenantId, createdAt: { gte: weekAgo } } }),
    prisma.contact.count({ where: { tenantId, orders: { some: {} } } }),
    prisma.contact.count({ where: { tenantId, appointments: { some: {} } } }),
    prisma.contact.groupBy({
      by: ['source'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.contact.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.contactMerge.count({ where: { tenantId } }),
  ]);

  return {
    total,
    newThisWeek,
    withOrders,
    withAppointments,
    mergeCount,
    bySource: bySource.map((r) => ({ source: r.source ?? 'unknown', count: r._count.id })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
  };
}
