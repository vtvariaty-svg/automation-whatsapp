import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = 'vtvariaty@gmail.com';
    const newPassword = 'AdminPassword123!';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'superadmin',
          isActive: true,
          forcePasswordReset: false,
          passwordHash,
          sessionVersion: { increment: 1 },
          emailVerifiedAt: new Date(),
        }
      });
    } else {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: 'Admin Workspace' } });
      }

      user = await prisma.user.create({
        data: {
          email,
          name: 'VTVariaty Admin',
          role: 'superadmin',
          isActive: true,
          passwordHash,
          tenantId: tenant.id,
          emailVerifiedAt: new Date(),
        }
      });
    }


    return NextResponse.json({ 
      success: true, 
      message: `User ${email} reset to superadmin with password: ${newPassword}`,
      user: {
        id: user.id,
        role: user.role,
        isActive: user.isActive,
        sessionVersion: user.sessionVersion
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
