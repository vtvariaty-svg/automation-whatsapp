import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        whatsappToken: true,
        whatsappBusinessAccountId: true,
        whatsappPhoneNumberId: true,
        whatsappPhoneId: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Connected if we have at least a token saved
    const connected = !!tenant.whatsappToken;
    const hasFullConfig = !!(tenant.whatsappToken && (tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId));

    return NextResponse.json({
      connected,
      hasFullConfig,
      whatsappBusinessAccountId: tenant.whatsappBusinessAccountId || null,
      whatsappPhoneNumberId: tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId || null,
    });
  } catch (error: any) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
