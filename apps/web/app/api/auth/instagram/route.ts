import { NextResponse } from 'next/server';

export async function GET() {
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  if (!fbAppId) {
    return NextResponse.json({ error: 'FB App ID not configured' }, { status: 500 });
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

  // Instagram uses Facebook's OAuth with instagram_basic scope
  const fbOAuthUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth');
  fbOAuthUrl.searchParams.set('client_id', fbAppId);
  fbOAuthUrl.searchParams.set('redirect_uri', redirectUri);
  fbOAuthUrl.searchParams.set('scope', 'public_profile,instagram_basic');
  fbOAuthUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(fbOAuthUrl.toString());
}
