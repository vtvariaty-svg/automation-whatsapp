import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';

// Instagram is connected via Facebook Login (not Instagram Login).
// This avoids the "Invalid platform app" error from instagram.com/oauth/authorize.
// The same Facebook App (NEXT_PUBLIC_FB_APP_ID) is used for WhatsApp and Facebook Messenger.
//
// Returns JSON { url } so the client can redirect via window.location.href.
// Accepts both Bearer token (Authorization header) and auth_token cookie.

export async function GET(request: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  if (!fbAppId) {
    return NextResponse.json({ error: 'missing_app_id' }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ tenantId: auth.tenantId })).toString('base64');
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

  return NextResponse.json({ url: url.toString() });
}
