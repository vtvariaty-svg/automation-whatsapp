import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const result = await registerUser(name, email, password);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
