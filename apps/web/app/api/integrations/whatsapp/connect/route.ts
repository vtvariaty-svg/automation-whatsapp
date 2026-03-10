import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export async function GET() {
  try {
    // Get tenantId from auth cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let tenantId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { tenantId: string };
      tenantId = decoded.tenantId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
    if (!fbAppId) {
      return NextResponse.json({ error: 'FB_APP_ID not configured' }, { status: 500 });
    }

    // Build the redirect URI based on the current host
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
    const redirectUri = `${baseUrl}/api/integrations/whatsapp/callback`;

    // Build Facebook OAuth URL
    const state = JSON.stringify({ tenantId });
    const encodedState = encodeURIComponent(Buffer.from(state).toString('base64'));

    const fbOAuthUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth');
    fbOAuthUrl.searchParams.set('client_id', fbAppId);
    fbOAuthUrl.searchParams.set('redirect_uri', redirectUri);
    fbOAuthUrl.searchParams.set('scope', 'whatsapp_business_management,whatsapp_business_messaging');
    fbOAuthUrl.searchParams.set('response_type', 'code');
    fbOAuthUrl.searchParams.set('state', encodedState);

    return NextResponse.redirect(fbOAuthUrl.toString());
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
