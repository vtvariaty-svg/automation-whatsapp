import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminEmail = 'vtvariaty@gmail.com';

    const user = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'superadmin',
        isActive: true
      }
    });
    
    return NextResponse.json({ 
      message: 'User promoted to superadmin successfully', 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to promote user' 
    }, { status: 400 });
  }
}
