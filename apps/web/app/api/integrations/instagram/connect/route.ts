import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Instagram is connected via Facebook Login (not Instagram Login).
// This avoids the "Invalid platform app" error from instagram.com/oauth/authorize.
// The same Facebook App (NEXT_PUBLIC_FB_APP_ID) is used for WhatsApp and Facebook Messenger.

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

    // Facebook App ID — shared with WhatsApp Embedded Signup and Facebook Messenger
    const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
    if (!fbAppId) return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_app_id`);

    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    const redirectUri = `${base}/api/integrations/instagram/callback`;

    // Instagram API with Facebook Login uses facebook.com/dialog/oauth, NOT instagram.com/oauth/authorize
    const url = new URL('https://www.facebook.com/v22.0/dialog/oauth');
    url.searchParams.set('client_id', fbAppId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', [
      'pages_show_list',
      'pages_manage_metadata',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ].join(','));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
