import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { isChannelItemAccessible, channelBlockedResponse } from '@/lib/auth/moduleGuard';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!(await isChannelItemAccessible('whatsapp'))) return channelBlockedResponse('whatsapp');

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        whatsappToken: true,
        whatsappBusinessAccountId: true,
        whatsappPhoneNumberId: true,
        whatsappPhoneId: true,
        whatsappConnection: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Connected if we have at least a token saved (legacy or new model)
    const connected = !!tenant.whatsappToken || tenant.whatsappConnection?.status === 'connected';
    const hasFullConfig = !!(
      (tenant.whatsappToken && (tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId)) ||
      (tenant.whatsappConnection?.wabaId && tenant.whatsappConnection?.phoneNumberId)
    );

    return NextResponse.json({
      connected,
      hasFullConfig,
      whatsappBusinessAccountId: tenant.whatsappConnection?.wabaId || tenant.whatsappBusinessAccountId || null,
      whatsappPhoneNumberId: tenant.whatsappConnection?.phoneNumberId || tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId || null,
      displayPhone: tenant.whatsappConnection?.displayPhone || null,
    });
  } catch (error: any) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
