import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/services/authService';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('auth_token')?.value || '';

    if (!isAdmin(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    
    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
