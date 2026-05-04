import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { checkFeature } from '@/lib/services/entitlementsService';
import { isChannelItemAccessible } from '@/lib/auth/moduleGuard';

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
    let role: string = 'user';
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { tenantId: string; role?: string };
      tenantId = decoded.tenantId;
      role = decoded.role || 'user';
    } catch {
      return NextResponse.redirect(`${base}/login`);
    }

    // Admin module guard: block if facebook channel is hidden or disabled
    if (!(await isChannelItemAccessible('facebook'))) {
      return NextResponse.redirect(`${base}/dashboard/integrations?error=plan_required&message=${encodeURIComponent('Facebook Manager está desativado pelo administrador.')}`);
    }

    // Plan enforcement: Facebook Messenger is only available on Pro and Business plans
    const facebookCheck = await checkFeature(tenantId, 'facebook', role);
    if (!facebookCheck.allowed) {
      return NextResponse.redirect(
        `${base}/dashboard/integrations?error=plan_required&message=${encodeURIComponent(facebookCheck.upgradeMessage || 'Facebook not available on your current plan.')}`
      );
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
