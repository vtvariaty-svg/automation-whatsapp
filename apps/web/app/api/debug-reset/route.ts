import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testPassword = url.searchParams.get('test') || 'AdminPassword123!';
    const email = 'vtvariaty@gmail.com';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const localCompare = await bcrypt.compare(testPassword, passwordHash);

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
      message: `User ${email} reset to superadmin with password: ${testPassword}`,
      debug: {
        testPassword,
        localCompareSuccess: localCompare,
        hashPrefix: passwordHash.substring(0, 7),
        hashLength: passwordHash.length
      },
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
