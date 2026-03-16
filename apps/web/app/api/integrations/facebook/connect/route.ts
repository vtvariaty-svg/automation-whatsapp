import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
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

    const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
    if (!fbAppId) return NextResponse.redirect(`${base}/dashboard/integrations?error=missing_app_id`);

    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    const url = new URL('https://www.facebook.com/v22.0/dialog/oauth');
    url.searchParams.set('client_id', fbAppId);
    url.searchParams.set('redirect_uri', `${base}/api/integrations/facebook/callback`);
    url.searchParams.set('scope', 'pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);

    return NextResponse.redirect(url.toString());
  } catch {
    return NextResponse.redirect(`${base}/dashboard/integrations?error=server_error`);
  }
}
