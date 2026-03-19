import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await params;

    if (actor.id === id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newStatus = !user.isActive;

    const after = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
      select: { id: true, isActive: true, email: true }
    });

    await auditService.log({
      actorUserId: actor.id, action: newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      targetUserId: id, targetTenantId: user.tenantId,
      entityType: 'user', entityId: id,
      before: { isActive: user.isActive },
      after: { isActive: newStatus },
      req
    });

    return NextResponse.json({ 
      message: newStatus ? 'User activated' : 'User deactivated', 
      isActive: after.isActive 
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/users/toggle-active]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
