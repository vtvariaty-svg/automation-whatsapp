import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getAgencyForTenant, getAgencyMemberRole } from '@/lib/agency';
import bcrypt from 'bcryptjs';

// GET /api/agency/tenants — list sub-tenants
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

    const tenants = await prisma.tenant.findMany({
      where: { agencyId: agency.id },
      include: {
        subscription: {
          select: { plan: true, status: true },
        },
      },
    });

    const result = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      isDemo: t.isDemo,
      subscription: t.subscription
        ? { plan: t.subscription.plan, status: t.subscription.status }
        : null,
      enabledChannels: t.enabledChannels,
      setupCompleted: t.setupCompleted,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agency/tenants — create sub-tenant
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agency = await getAgencyForTenant(auth.tenantId);
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const role = await getAgencyMemberRole(agency.id, auth.userId);
    if (!role || (role !== 'owner' && role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantName, adminEmail, niche, plan } = body;

    if (!tenantName || !adminEmail) {
      return NextResponse.json({ error: 'tenantName and adminEmail are required' }, { status: 400 });
    }

    // Generate a random 8-char temp password
    const tempPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Create tenant, user and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          agencyId: agency.id,
          agencyBranding: true,
          businessType: niche ?? null,
        },
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          role: 'admin',
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: plan ?? 'free',
          status: 'trialing',
          trialEnd,
        },
      });

      return tenant;
    });

    return NextResponse.json(
      { tenant: result, tempPassword, loginEmail: adminEmail },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
