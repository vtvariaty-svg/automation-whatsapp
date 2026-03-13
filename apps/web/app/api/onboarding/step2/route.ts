import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if WhatsApp is connected
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { whatsappToken: true, whatsappPhoneNumberId: true, whatsappPhoneId: true },
    });

    const isConnected = !!(tenant?.whatsappToken);

    if (isConnected) {
      await prisma.tenant.update({
        where: { id: auth.tenantId },
        data: { setupStep: 3 },
      });
      return NextResponse.json({ success: true, nextStep: 3, connected: true });
    }

    return NextResponse.json({ success: true, connected: false, message: 'WhatsApp not connected yet' });
  } catch (error: any) {
    console.error('Onboarding step 2 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
