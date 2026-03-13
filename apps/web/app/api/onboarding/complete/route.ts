import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        setupCompleted: true,
        setupStep: 6,
      },
    });

    return NextResponse.json({ success: true, setupCompleted: true });
  } catch (error: any) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
