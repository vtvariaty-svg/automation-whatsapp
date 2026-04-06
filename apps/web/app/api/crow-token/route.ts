/**
 * GET /api/crow-token
 * Returns a HMAC-SHA256 signature of the userId for Crow widget identity.
 * Crow uses this to verify the identity of the logged-in user.
 * Secret: CROW_VERIFICATION_SECRET — must be set in Render env.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = process.env.CROW_VERIFICATION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CROW_VERIFICATION_SECRET not configured' }, { status: 500 });
  }

  const signature = crypto
    .createHmac('sha256', secret)
    .update(auth.userId)
    .digest('hex');

  return NextResponse.json({ token: signature });
}
