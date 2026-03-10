import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let tenantId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { tenantId: string };
      tenantId = decoded.tenantId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
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

    const connected = !!(tenant.whatsappToken && (tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId));

    return NextResponse.json({
      connected,
      whatsappBusinessAccountId: tenant.whatsappBusinessAccountId || null,
      whatsappPhoneNumberId: tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId || null,
    });
  } catch (error: any) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
