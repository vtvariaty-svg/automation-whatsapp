import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';

// GET /api/agency — get current tenant's agency info
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'agencyReseller', auth.role);
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

  try {
    const agency = await prisma.agency.findUnique({
      where: { ownerTenantId: auth.tenantId },
    });

    if (!agency) {
      return NextResponse.json(null);
    }

    const [memberCount, tenantCount] = await Promise.all([
      prisma.agencyMember.count({ where: { agencyId: agency.id } }),
      prisma.tenant.count({ where: { agencyId: agency.id } }),
    ]);

    return NextResponse.json({ ...agency, memberCount, tenantCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agency — create agency
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const checkPost = await checkFeature(auth.tenantId, 'agencyReseller', auth.role);
  if (!checkPost.allowed) return NextResponse.json({ error: checkPost.upgradeMessage }, { status: 403 });

  try {
    const body = await request.json();
    const { name, logoUrl, primaryColor, billingMode } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Check if already an agency
    const existing = await prisma.agency.findUnique({
      where: { ownerTenantId: auth.tenantId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Tenant already has an agency' }, { status: 409 });
    }

    const agency = await prisma.agency.create({
      data: {
        name,
        ownerTenantId: auth.tenantId,
        logoUrl: logoUrl ?? null,
        primaryColor: primaryColor ?? '#4f46e5',
        billingMode: billingMode ?? 'separate',
      },
    });

    // Auto-add the creator as owner member
    await prisma.agencyMember.create({
      data: {
        agencyId: agency.id,
        userId: auth.userId,
        role: 'owner',
      },
    });

    return NextResponse.json(agency, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
