import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';

// Instagram Login connect flow.
// Uses api.instagram.com/oauth/authorize with Instagram-specific scopes.
// No Facebook Page dependency required.
// Returns JSON { url } so the client can redirect via window.location.href.

export async function GET(request: Request) {
  let base = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!base.startsWith('http')) base = `https://${base}`;

  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // NEXT_PUBLIC_INSTAGRAM_APP_ID is the Instagram-specific app ID.
  // Falls back to NEXT_PUBLIC_FB_APP_ID if the same Meta app is used for all channels.
  const igAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_FB_APP_ID;
  if (!igAppId) return NextResponse.json({ error: 'missing_app_id' }, { status: 500 });

  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI || `${base}/api/integrations/instagram/callback`;
  const state = Buffer.from(JSON.stringify({ tenantId: auth.tenantId })).toString('base64');

  const url = new URL('https://api.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', igAppId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
  ].join(','));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  console.log(`[IG_CONNECT] Instagram Login OAuth URL generated for tenant=${auth.tenantId}`);

  return NextResponse.json({ url: url.toString() });
}
