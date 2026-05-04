import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/authService';
import { sendLeadEventToMetaCapi } from '@/lib/services/metaCapiService';
import { PLANS } from '@/lib/config/plans';

// JWT expires in 1d = 86400 seconds
const COOKIE_MAX_AGE = 86400;

export async function POST(req: Request) {
  try {
    let { name, email, password, plan, eventId } = await req.json();

    // Only allow current public vertical plans for self-service registration.
    // Legacy plans (free/pro/standard/starter) and admin tiers always fall back to 'free'.
    const PUBLIC_REGISTRATION_PLANS = ['consultorio', 'restaurante'];
    if (!plan || !PUBLIC_REGISTRATION_PLANS.includes(plan)) {
      plan = 'free';
    }

    const result = await registerUser(name, email, password, 'user', plan);

    // If an eventId was provided from the landing page, fire the Conversions API 'Lead' event.
    // Done asynchronously so it doesn't block the actual sign-up completion.
    if (eventId) {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      // Disable await so this fires in the background
      sendLeadEventToMetaCapi({
        email,
        eventId,
        clientIp,
        userAgent,
      }).catch((e) => console.error('[Meta CAPI] Unhandled error during dispatch:', e));
    }

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
