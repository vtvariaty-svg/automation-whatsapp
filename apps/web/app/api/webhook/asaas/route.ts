/**
 * POST /api/webhook/asaas?tenantId=<id>
 *
 * Receives Asaas webhook events. Does NOT use JWT auth.
 * Authentication: asaas-access-token header validated against TenantPaymentConfig.webhookAuthToken.
 * Idempotency: PaymentEvent.providerEventId unique constraint.
 * Must respond quickly — all heavy work is synchronous but minimal.
 */
import { NextResponse } from 'next/server';
import { processWebhookEvent } from '@/src/services/paymentService';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  let rawEvent: Record<string, any>;
  try {
    rawEvent = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const asaasAccessTokenHeader = request.headers.get('asaas-access-token');

  const result = await processWebhookEvent({
    tenantId,
    asaasAccessTokenHeader,
    rawEvent,
  });

  return NextResponse.json({ message: result.message }, { status: result.status });
}
