import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getAgencyForTenant, getAgencyMemberRole } from '@/lib/agency';
import { subDays, startOfDay } from 'date-fns';

// GET /api/agency/performance?period=7days|30days
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agency = await getAgencyForTenant(auth.tenantId);
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const role = await getAgencyMemberRole(agency.id, auth.userId);
    if (!role || (role !== 'owner' && role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '7days';
    const days = period === '30days' ? 30 : 7;
    const since = startOfDay(subDays(new Date(), days));

    const tenants = await prisma.tenant.findMany({
      where: { agencyId: agency.id },
      include: {
        subscription: { select: { plan: true, status: true } },
      },
    });

    const performanceData = await Promise.all(
      tenants.map(async (tenant) => {
        const [conversations, messages, automationsActive, leads] = await Promise.all([
          prisma.conversation.count({
            where: { tenantId: tenant.id, createdAt: { gte: since } },
          }),
          prisma.message.count({
            where: {
              conversation: { tenantId: tenant.id },
              createdAt: { gte: since },
            },
          }),
          prisma.automationRule.count({
            where: { tenantId: tenant.id, active: true },
          }),
          prisma.conversionLead.count({
            where: { tenantId: tenant.id, createdAt: { gte: since } },
          }),
        ]);

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          plan: tenant.subscription?.plan ?? 'starter',
          conversations,
          messages,
          automationsActive,
          leads,
          setupCompleted: tenant.setupCompleted,
        };
      })
    );

    return NextResponse.json(performanceData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
