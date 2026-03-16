import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getAgencyForTenant, getAgencyMemberRole } from '@/lib/agency';

// GET /api/agency/members — list members (agency owner only)
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agency = await getAgencyForTenant(auth.tenantId);
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const role = await getAgencyMemberRole(agency.id, auth.userId);
    if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const members = await prisma.agencyMember.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agency/members — add member (agency owner only)
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agency = await getAgencyForTenant(auth.tenantId);
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const role = await getAgencyMemberRole(agency.id, auth.userId);
    if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { userId, role: memberRole } = body;

    if (!userId || !memberRole) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    const validRoles = ['owner', 'manager', 'viewer'];
    if (!validRoles.includes(memberRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const member = await prisma.agencyMember.create({
      data: {
        agencyId: agency.id,
        userId,
        role: memberRole,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/agency/members — remove member (agency owner only)
export async function DELETE(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const agency = await getAgencyForTenant(auth.tenantId);
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const role = await getAgencyMemberRole(agency.id, auth.userId);
    if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await prisma.agencyMember.delete({
      where: { agencyId_userId: { agencyId: agency.id, userId } },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
