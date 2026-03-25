import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/authService';

// JWT expires in 1d = 86400 seconds
const COOKIE_MAX_AGE = 86400;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const result = await loginUser(email, password, { ip, userAgent });

    const response = NextResponse.json(result);

    // Set auth_token as httpOnly cookie — source of truth for middleware.
    // The token is also returned in the JSON body for localStorage/Bearer compat.
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error('[LOGIN_ERROR]', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
