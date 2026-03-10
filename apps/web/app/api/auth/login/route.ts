import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/authService';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const result = await loginUser(email, password);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
