import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    if (!authToken) return NextResponse.redirect(`${base}/login`);

    let tenantId: string;
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { tenantId: string };
      tenantId = decoded.tenantId;
    } catch {
      return NextResponse.redirect(`${base}/login`);
    }

    // Use Instagram-specific App ID (from Instagram product in Meta Developer Portal)
    const igAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    if (!igAppId) return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_instagram_app_id`);

    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    const redirectUri = `${base}/api/integrations/instagram/callback`;

    // Instagram Business Login — uses instagram.com, NOT facebook.com
    const url = new URL('https://www.instagram.com/oauth/authorize');
    url.searchParams.set('client_id', igAppId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
