import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';

// JWT expires in 1d = 86400 seconds
const COOKIE_MAX_AGE = 86400;

export async function POST(req: Request) {
  try {
    const { name, email, password, plan } = await req.json();
    const result = await registerUser(name, email, password, 'user', plan);

    const response = NextResponse.json(result);

    // When email verification is not required, a token is returned immediately.
    // Set it as httpOnly cookie — source of truth for middleware.
    // The token is also in the JSON body for localStorage/Bearer compat.
    if (result.token) {
      response.cookies.set('auth_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
