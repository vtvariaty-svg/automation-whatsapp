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
