import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://automation-whatsapp.onrender.com';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=instagram_cancelled`);
  }

  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const fbAppSecret = process.env.FB_APP_SECRET;
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

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
      console.error('IG token exchange error:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/login?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get Facebook profile (Instagram uses FB login)
    const profileRes = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=id,name,email&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    if (!profile.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=profile_failed`);
    }

    // Try to get Instagram account info
    let instagramId: string | null = null;
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?access_token=${accessToken}`
      );
      const igData = await igRes.json();

      if (igData.data && igData.data.length > 0) {
        for (const page of igData.data) {
          const igAccountRes = await fetch(
            `https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
          );
          const igAccount = await igAccountRes.json();
          if (igAccount.instagram_business_account) {
            instagramId = igAccount.instagram_business_account.id;
            break;
          }
        }
      }
    } catch (igErr) {
      console.error('Instagram account fetch error (non-fatal):', igErr);
    }

    const fbId = profile.id;
    const name = profile.name || 'Usuário';
    const email = profile.email || `ig_${fbId}@instagram.com`;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ facebookId: fbId }, { instagramId: instagramId || undefined }, { email }] }
    });

    if (user) {
      const updateData: any = {};
      if (!user.facebookId) updateData.facebookId = fbId;
      if (instagramId && !user.instagramId) updateData.instagramId = instagramId;
      if (!user.name) updateData.name = name;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      const tenant = await prisma.tenant.create({
        data: { name: `${name}'s Workspace` }
      });

      user = await prisma.user.create({
        data: {
          email,
          name,
          facebookId: fbId,
          instagramId,
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

    return NextResponse.redirect(
      `${baseUrl}/auth/callback?token=${encodeURIComponent(token)}&provider=instagram`
    );
  } catch (err: any) {
    console.error('Instagram auth error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`);
  }
}
