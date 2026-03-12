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
        whatsappToken: null,
        whatsappBusinessAccountId: null,
        whatsappPhoneNumberId: null,
        whatsappPhoneId: null,
      }
    });

    try {
      await prisma.whatsAppConnection.update({
        where: { tenantId: auth.tenantId },
        data: { status: 'disconnected' }
      });
    } catch (e) {
      // Ignore if record doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
