import { prisma } from '@/lib/prisma';

export interface Agency {
  id: string;
  name: string;
  ownerTenantId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  billingMode: string;
  createdAt: Date;
}

/**
 * Returns the Agency record where ownerTenantId === tenantId,
 * i.e. this tenant IS an agency owner.
 */
export async function getAgencyForTenant(tenantId: string): Promise<Agency | null> {
  return prisma.agency.findUnique({
    where: { ownerTenantId: tenantId },
  });
}

/**
 * Returns AgencyMember.role for the given user in the given agency, or null if not a member.
 */
export async function getAgencyMemberRole(agencyId: string, userId: string): Promise<string | null> {
  const member = await prisma.agencyMember.findUnique({
    where: { agencyId_userId: { agencyId, userId } },
  });
  return member?.role ?? null;
}

/**
 * Returns true if:
 * 1. agencyTenantId owns an agency
 * 2. The user is owner or manager of that agency
 * 3. The subtenant belongs to that agency
 */
export async function canManageSubtenant(
  agencyTenantId: string,
  userId: string,
  subtenantId: string
): Promise<boolean> {
  const agency = await getAgencyForTenant(agencyTenantId);
  if (!agency) return false;

  const role = await getAgencyMemberRole(agency.id, userId);
  if (!role || (role !== 'owner' && role !== 'manager')) return false;

  const subtenant = await prisma.tenant.findUnique({
    where: { id: subtenantId },
    select: { agencyId: true },
  });
  if (!subtenant) return false;

  return subtenant.agencyId === agency.id;
}
