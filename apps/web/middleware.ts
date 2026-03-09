import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value || ''; // In middleware we check cookies, but requirement said localStorage for simplicity in Stage 2. 
  // Wait, Next.js middleware doesn't have access to localStorage.
  // The user asked for localStorage in lib/auth/auth.ts, but protection in middleware usually needs cookies.
  // I will implement a client-side check in layout or a simple middleware that checks for a cookie if possible.
  // To follow the "fake" requirement and "middleware" mention, I'll use a hack or just clear logic.
  
  const { pathname } = request.nextUrl;

  // Let's assume we use a cookie for middleware as it's the standard for Next.js
  const hasToken = request.cookies.get('auth_token');

  if (pathname.startsWith('/dashboard') && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
