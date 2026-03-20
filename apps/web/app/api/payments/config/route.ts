import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { setupPaymentConfig } from '@/src/services/paymentService';

// GET /api/payments/config — returns config with credentials masked
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId: auth.tenantId },
  });

  if (!config) return NextResponse.json(null);

  return NextResponse.json({
    id:               config.id,
    provider:         config.provider,
    environment:      config.environment,
    enabled:          config.enabled,
    apiKeyMasked:     maskSecret(config.apiKey),
    webhookRegistered: !!config.webhookId,
    createdAt:        config.createdAt,
    updatedAt:        config.updatedAt,
    // apiKey, webhookAuthToken, webhookId are NEVER returned
  });
}

// POST /api/payments/config — save API key, auto-generate token, auto-register webhook
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { environment, enabled, apiKey } = body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json({ error: 'apiKey é obrigatório' }, { status: 400 });
  }

  const validEnvs = ['sandbox', 'production'];
  if (environment && !validEnvs.includes(environment)) {
    return NextResponse.json({ error: 'environment inválido. Use sandbox ou production' }, { status: 400 });
  }

  try {
    const result = await setupPaymentConfig({
      tenantId:    auth.tenantId,
      apiKey:      apiKey.trim(),
      environment: environment ?? 'sandbox',
      enabled:     enabled ?? false,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[POST /api/payments/config]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••';
  return '••••••' + value.slice(-4);
}
