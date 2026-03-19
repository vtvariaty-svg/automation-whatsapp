import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(req);
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, emailVerifiedAt: true, lastLoginAt: true,
        createdAt: true, tenantId: true, forcePasswordReset: true,
        tenant: { select: { id: true, name: true } },
        loginEvents: { orderBy: { createdAt: 'desc' }, take: 10,
          select: { id: true, ipAddress: true, userAgent: true, createdAt: true } }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await params;
    const body  = await req.json();
    
    const allowedFields = ['name', 'role', 'isActive', 'forcePasswordReset'];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Prevent superadmin from removing their own access
    if (id === actor.id && (updateData.role !== undefined || updateData.isActive === false)) {
      return NextResponse.json({ error: 'Cannot modify your own superadmin role or deactivate yourself' }, { status: 403 });
    }

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const after = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, forcePasswordReset: true }
    });

    await auditService.log({
      actorUserId: actor.id, action: 'UPDATE_USER',
      targetUserId: id, targetTenantId: before.tenantId,
      entityType: 'user', entityId: id,
      before, after, req
    });

    return NextResponse.json(after);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
