import { NextRequest, NextResponse } from 'next/server';
import { trackReferralSignup } from '@/lib/referral';

// POST /api/referral/track — PUBLIC endpoint, called on new tenant signup with referral code
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const { code, referredTenantId } = body;

  if (!code || !referredTenantId) {
    return NextResponse.json(
      { error: 'code and referredTenantId are required' },
      { status: 400 }
    );
  }

  const conversion = await trackReferralSignup(code, referredTenantId);

  return NextResponse.json({ ok: true, tracked: conversion !== null });
}
