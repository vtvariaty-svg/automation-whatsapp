import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    // Get tenantId from auth cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com'));
    }

    let tenantId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { tenantId: string };
      tenantId = decoded.tenantId;
    } catch {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com'));
    }

    const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
    if (!fbAppId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=missing_app_id`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
    // Use the client-side callback page (not API route) for implicit flow
    const redirectUri = `${baseUrl}/dashboard/integrations/callback`;

    // Encode tenantId in state
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');

    // Build Facebook OAuth URL with IMPLICIT grant (response_type=token)
    // This does NOT require FB_APP_SECRET
    const fbOAuthUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth');
    fbOAuthUrl.searchParams.set('client_id', fbAppId);
    fbOAuthUrl.searchParams.set('redirect_uri', redirectUri);
    fbOAuthUrl.searchParams.set('scope', 'whatsapp_business_management,whatsapp_business_messaging');
    fbOAuthUrl.searchParams.set('response_type', 'token');
    fbOAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(fbOAuthUrl.toString());
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=server_error`);
  }
}
