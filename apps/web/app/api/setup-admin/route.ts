import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';

export async function GET() {
  try {
    const adminEmail = 'vtvariaty@gmail.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin';

    const result = await registerUser(adminName, adminEmail, adminPassword, 'admin');
    
    return NextResponse.json({ 
      message: 'Admin user created successfully', 
      user: result.user 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to create admin user' 
    }, { status: 400 });
  }
}
