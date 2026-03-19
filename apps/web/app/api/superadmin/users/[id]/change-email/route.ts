import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await params;
    const { newEmail } = await req.json();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const collision = await prisma.user.findUnique({ where: { email: newEmail } });
    if (collision) {
      return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 });
    }

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const after = await prisma.user.update({
      where: { id },
      data: { 
        email: newEmail,
        // Optional: unverify email on change
        // emailVerifiedAt: null 
      },
      select: { id: true, email: true, name: true }
    });

    await auditService.log({
      actorUserId: actor.id, action: 'CHANGE_EMAIL',
      targetUserId: id, targetTenantId: before.tenantId,
      entityType: 'user', entityId: id,
      before: { email: before.email },
      after: { email: after.email },
      req
    });

    return NextResponse.json({ message: 'Email updated successfully', email: after.email });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/users/change-email]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
