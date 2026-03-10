import { NextResponse } from 'next/server';
import { isAdmin, registerUser } from '@/lib/services/authService';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('auth_token')?.value || '';

    if (!isAdmin(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();
    const result = await registerUser(name, email, password, role);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
