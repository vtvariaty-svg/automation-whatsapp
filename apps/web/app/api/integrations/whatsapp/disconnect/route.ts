import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export async function POST() {
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

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        whatsappToken: null,
        whatsappBusinessAccountId: null,
        whatsappPhoneNumberId: null,
        whatsappPhoneId: null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
