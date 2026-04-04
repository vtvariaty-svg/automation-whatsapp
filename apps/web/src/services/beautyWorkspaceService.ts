// BW1 — Beauty Workspace domain service
// All operations are tenant-scoped and use direct prisma calls.
// No cross-tenant data access is possible by design.

import { prisma } from '@/lib/prisma';

// ─── Workspace activation ─────────────────────────────────────────────────────

export async function getWorkspaceConfig(tenantId: string) {
  return prisma.beautyWorkspaceConfig.findUnique({ where: { tenantId } });
}

export async function activateWorkspace(
  tenantId: string,
  data: {
    businessSubtype?: string;
    depositRequired?: boolean;
    defaultDepositPercent?: number;
    reengagementDays?: number;
    confirmationLeadHours?: number;
    reminderLeadHours?: number;
  }
) {
  return prisma.beautyWorkspaceConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      status: 'active',
      ...data,
    },
    update: {
      status: 'active',
      updatedAt: new Date(),
      ...data,
    },
  });
}

export async function updateWorkspaceConfig(
  tenantId: string,
  data: Partial<{
    status: string;
    businessSubtype: string;
    depositRequired: boolean;
    defaultDepositPercent: number;
    reengagementDays: number;
    confirmationLeadHours: number;
    reminderLeadHours: number;
  }>
) {
  return prisma.beautyWorkspaceConfig.update({
    where: { tenantId },
    data: { ...data, updatedAt: new Date() },
  });
}

// ─── Service profiles ─────────────────────────────────────────────────────────

export async function upsertServiceProfile(
  tenantId: string,
  serviceId: string,
  data: {
    category?: string;
    priceFrom?: number;
    priceTo?: number;
    requiresDeposit?: boolean;
    depositAmount?: number;
    photoUrl?: string;
    description?: string;
  }
) {
  return prisma.beautyServiceProfile.upsert({
    where: { serviceId },
    create: { tenantId, serviceId, ...data },
    update: { ...data, updatedAt: new Date() },
  });
}

export async function getServiceProfiles(tenantId: string) {
  return prisma.beautyServiceProfile.findMany({
    where: { tenantId },
    include: { service: true },
    orderBy: { popularityScore: 'desc' },
  });
}

export async function incrementServicePopularity(serviceId: string) {
  return prisma.beautyServiceProfile.updateMany({
    where: { serviceId },
    data: { popularityScore: { increment: 1 } },
  });
}

// ─── Customer profiles ────────────────────────────────────────────────────────

export async function getOrCreateCustomerProfile(tenantId: string, contactId: string) {
  const existing = await prisma.beautyCustomerProfile.findUnique({ where: { contactId } });
  if (existing) return existing;
  return prisma.beautyCustomerProfile.create({ data: { tenantId, contactId } });
}

export async function updateCustomerProfile(
  tenantId: string,
  contactId: string,
  data: Partial<{
    preferredProfessional: string;
    preferredServices: string[];
    notes: string;
    lastServiceAt: Date;
    totalVisits: number;
    totalSpend: number;
    birthdayDate: string;
    loyaltyPoints: number;
    vipStatus: boolean;
    reengagementSentAt: Date;
  }>
) {
  return prisma.beautyCustomerProfile.update({
    where: { contactId },
    data: { ...data, updatedAt: new Date() },
  });
}

export async function recordVisitCompletion(
  tenantId: string,
  contactId: string,
  serviceAmount: number
) {
  return prisma.beautyCustomerProfile.upsert({
    where: { contactId },
    create: {
      tenantId,
      contactId,
      totalVisits: 1,
      totalSpend: serviceAmount,
      lastServiceAt: new Date(),
    },
    update: {
      totalVisits: { increment: 1 },
      totalSpend: { increment: serviceAmount },
      lastServiceAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/** Returns customers who haven't visited in `inactivityDays` and haven't been sent
 *  a reengagement in `cooldownDays`. Used by campaign trigger jobs. */
export async function getInactiveCustomers(
  tenantId: string,
  inactivityDays: number,
  cooldownDays: number
) {
  const inactivityCutoff = new Date();
  inactivityCutoff.setDate(inactivityCutoff.getDate() - inactivityDays);

  const cooldownCutoff = new Date();
  cooldownCutoff.setDate(cooldownCutoff.getDate() - cooldownDays);

  return prisma.beautyCustomerProfile.findMany({
    where: {
      tenantId,
      lastServiceAt: { lt: inactivityCutoff },
      OR: [
        { reengagementSentAt: null },
        { reengagementSentAt: { lt: cooldownCutoff } },
      ],
    },
    include: { contact: true },
  });
}

// ─── Professional profiles ────────────────────────────────────────────────────

export async function upsertProfessionalProfile(
  tenantId: string,
  professionalId: string,
  data: {
    specialties?: string[];
    commissionPct?: number;
    photoUrl?: string;
    bio?: string;
    instagramHandle?: string;
  }
) {
  return prisma.beautyProfessionalProfile.upsert({
    where: { professionalId },
    create: { tenantId, professionalId, ...data },
    update: { ...data, updatedAt: new Date() },
  });
}

export async function getProfessionalProfiles(tenantId: string) {
  return prisma.beautyProfessionalProfile.findMany({
    where: { tenantId },
    include: { professional: true },
  });
}

// ─── Slot locking (race-condition prevention) ─────────────────────────────────

/** Acquires a 5-minute slot lock. Returns null if slot is already locked. */
export async function acquireSlotLock(
  tenantId: string,
  sessionId: string,
  date: string,
  time: string,
  durationMinutes: number,
  professionalId?: string
): Promise<{ id: string } | null> {
  // Clean expired locks first
  await prisma.appointmentLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // Check for conflicting active lock
  const conflict = await prisma.appointmentLock.findFirst({
    where: {
      tenantId,
      date,
      time,
      ...(professionalId ? { professionalId } : {}),
      expiresAt: { gt: new Date() },
    },
  });
  if (conflict) return null;

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  return prisma.appointmentLock.create({
    data: { tenantId, sessionId, date, time, durationMinutes, expiresAt, professionalId },
  });
}

export async function releaseSlotLock(lockId: string, tenantId: string) {
  return prisma.appointmentLock.deleteMany({ where: { id: lockId, tenantId } });
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function addToWaitlist(
  tenantId: string,
  data: {
    contactId?: string;
    serviceId?: string;
    professionalId?: string;
    preferredDate?: string;
    preferredTime?: string;
  }
) {
  return prisma.beautyWaitlistEntry.create({ data: { tenantId, ...data } });
}

export async function getWaitlist(tenantId: string) {
  return prisma.beautyWaitlistEntry.findMany({
    where: { tenantId, status: 'waiting' },
    orderBy: { createdAt: 'asc' },
  });
}

export async function notifyWaitlistEntry(id: string, tenantId: string) {
  return prisma.beautyWaitlistEntry.update({
    where: { id },
    data: { status: 'notified', notifiedAt: new Date() },
  });
}

// ─── Packages ─────────────────────────────────────────────────────────────────

export async function createPackage(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    totalSessions: number;
    priceTotal: number;
    validityDays?: number;
    items: Array<{ serviceId: string; quantity?: number }>;
  }
) {
  const { items, ...packageData } = data;
  return prisma.beautyPackage.create({
    data: {
      tenantId,
      ...packageData,
      items: {
        create: items.map((i) => ({
          id: crypto.randomUUID(),
          serviceId: i.serviceId,
          quantity: i.quantity ?? 1,
        })),
      },
    },
    include: { items: true },
  });
}

export async function getPackages(tenantId: string) {
  return prisma.beautyPackage.findMany({
    where: { tenantId, active: true },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignPackageToCustomer(
  tenantId: string,
  contactId: string,
  packageId: string
) {
  const pkg = await prisma.beautyPackage.findFirst({ where: { id: packageId, tenantId } });
  if (!pkg) throw new Error('Package not found');

  const profile = await getOrCreateCustomerProfile(tenantId, contactId);

  const expiresAt = pkg.validityDays
    ? new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000)
    : null;

  return prisma.customerBeautyPackage.create({
    data: {
      id: crypto.randomUUID(),
      tenantId,
      contactId,
      packageId,
      beautyProfileId: profile.id,
      sessionsTotal: pkg.totalSessions,
      sessionsUsed: 0,
      expiresAt,
    },
  });
}

export async function redeemPackageSession(
  customerPkgId: string,
  tenantId: string,
  appointmentId?: string
) {
  const pkg = await prisma.customerBeautyPackage.findFirst({
    where: { id: customerPkgId },
    include: { beautyProfile: true },
  });
  if (!pkg) throw new Error('Package not found');
  if (pkg.sessionsUsed >= pkg.sessionsTotal) throw new Error('Package exhausted');

  const [usage] = await prisma.$transaction([
    prisma.beautyPackageUsage.create({
      data: {
        id: crypto.randomUUID(),
        customerPkgId,
        appointmentId,
      },
    }),
    prisma.customerBeautyPackage.update({
      where: { id: customerPkgId },
      data: {
        sessionsUsed: { increment: 1 },
        status: pkg.sessionsUsed + 1 >= pkg.sessionsTotal ? 'exhausted' : 'active',
      },
    }),
  ]);
  return usage;
}

// ─── Campaign rules ───────────────────────────────────────────────────────────

export async function getCampaignRules(tenantId: string) {
  return prisma.beautyCampaignRule.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCampaignRule(
  tenantId: string,
  data: {
    name: string;
    triggerType: string;
    inactivityDays?: number;
    messageTemplate: string;
    channel?: string;
    cooldownDays?: number;
  }
) {
  return prisma.beautyCampaignRule.create({ data: { tenantId, ...data } });
}

export async function logCampaignRun(
  tenantId: string,
  ruleId: string,
  contactId: string | undefined,
  status: 'sent' | 'failed'
) {
  return prisma.beautyCampaignRun.create({
    data: {
      id: crypto.randomUUID(),
      tenantId,
      ruleId,
      contactId,
      status,
    },
  });
}
