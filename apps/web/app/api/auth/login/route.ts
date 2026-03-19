import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/authService';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const result = await loginUser(email, password, { ip, userAgent });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
