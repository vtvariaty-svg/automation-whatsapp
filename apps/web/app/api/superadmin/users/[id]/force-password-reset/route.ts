import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const unhashedToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(unhashedToken).digest('hex');
    
    // Create password reset token & force reset flag
    const [token, updatedUser] = await prisma.$transaction([
      prisma.verificationToken.create({
        data: {
          identifier: user.email,
          tokenHash,
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        }
      }),
      prisma.user.update({
        where: { id },
        data: { forcePasswordReset: true }
      })
    ]);

    await auditService.log({
      actorUserId: actor.id, action: 'FORCE_PASSWORD_RESET',
      targetUserId: id, targetTenantId: user.tenantId,
      entityType: 'user', entityId: id,
      before: { forcePasswordReset: user.forcePasswordReset },
      after: { forcePasswordReset: true, tokenLinkCreated: true },
      req
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://automation-whatsapp.onrender.com';
    const resetLink = `${baseUrl}/reset-password?token=${unhashedToken}`;

    return NextResponse.json({ 
      message: 'Password reset enforced.', 
      resetLink 
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/users/force-reset]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
