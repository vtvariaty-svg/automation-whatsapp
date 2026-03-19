import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';
  if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=facebook_cancelled`);
  }

  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const fbAppSecret = process.env.FB_APP_SECRET;
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  if (!fbAppId || !fbAppSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=server_config`);
  }

  try {
    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', fbAppId);
    tokenUrl.searchParams.set('client_secret', fbAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('FB token exchange error:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/login?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user profile from Facebook
    const profileRes = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=id,name,email&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    if (!profile.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=profile_failed`);
    }

    const fbId = profile.id;
    const name = profile.name || 'Usuário';
    const email = profile.email || `fb_${fbId}@facebook.com`;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ facebookId: fbId }, { email }] }
    });

    if (user) {
      // Update facebookId if not set
      if (!user.facebookId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { facebookId: fbId, name: name }
        });
      }
    } else {
      // Create new user + tenant
      const tenant = await prisma.tenant.create({
        data: { name: `${name}'s Workspace` }
      });

      user = await prisma.user.create({
        data: {
          email,
          name,
          facebookId: fbId,
          tenantId: tenant.id,
          role: 'user',
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set cookies and redirect
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Also set localStorage-compatible script via a redirect page
    return NextResponse.redirect(
      `${baseUrl}/auth/callback?token=${encodeURIComponent(token)}&provider=facebook`
    );
  } catch (err: any) {
    console.error('Facebook auth error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`);
  }
}
