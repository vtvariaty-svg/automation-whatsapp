import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(req);
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true }
        },
        aiUsages: {
          orderBy: { createdAt: 'desc' }, take: 1
        }
      }
    });

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    return NextResponse.json(tenant);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
