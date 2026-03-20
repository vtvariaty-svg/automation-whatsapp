import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

// GET /api/payments/config — returns config with apiKey masked
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId: auth.tenantId },
  });

  if (!config) return NextResponse.json(null);

  return NextResponse.json({
    id:              config.id,
    provider:        config.provider,
    environment:     config.environment,
    enabled:         config.enabled,
    apiKeyMasked:    maskSecret(config.apiKey),
    hasWebhookToken: config.webhookAuthToken.length > 0,
    createdAt:       config.createdAt,
    updatedAt:       config.updatedAt,
    // apiKey and webhookAuthToken are NEVER returned
  });
}

// POST /api/payments/config — upsert Asaas config
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { provider, environment, enabled, apiKey, webhookAuthToken } = body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json({ error: 'apiKey é obrigatório' }, { status: 400 });
  }
  if (!webhookAuthToken || typeof webhookAuthToken !== 'string' || webhookAuthToken.trim().length === 0) {
    return NextResponse.json({ error: 'webhookAuthToken é obrigatório' }, { status: 400 });
  }

  const validEnvs = ['sandbox', 'production'];
  if (environment && !validEnvs.includes(environment)) {
    return NextResponse.json({ error: 'environment inválido. Use sandbox ou production' }, { status: 400 });
  }

  const config = await prisma.tenantPaymentConfig.upsert({
    where:  { tenantId: auth.tenantId },
    create: {
      tenantId:         auth.tenantId,
      provider:         provider ?? 'asaas',
      environment:      environment ?? 'sandbox',
      enabled:          enabled ?? false,
      apiKey:           apiKey.trim(),
      webhookAuthToken: webhookAuthToken.trim(),
    },
    update: {
      provider:         provider ?? 'asaas',
      environment:      environment ?? 'sandbox',
      enabled:          enabled ?? false,
      apiKey:           apiKey.trim(),
      webhookAuthToken: webhookAuthToken.trim(),
    },
  });

  return NextResponse.json({
    id:              config.id,
    provider:        config.provider,
    environment:     config.environment,
    enabled:         config.enabled,
    apiKeyMasked:    maskSecret(config.apiKey),
    hasWebhookToken: config.webhookAuthToken.length > 0,
    updatedAt:       config.updatedAt,
  });
}

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••';
  return '••••••' + value.slice(-4);
}
