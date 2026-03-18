import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getSubscription } from '@/lib/services/subscriptionService';
import { planAtLeast } from '@/lib/config/plans';
import { uploadCertificate, getCertificateStatus } from '@/lib/integrations/fiscal/certificateClient';

// ── GET /api/fiscal/certificate — status do certificado ativo ────────────────
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await getSubscription(auth.tenantId);
  if (!planAtLeast(sub?.plan ?? 'free', 'pro')) {
    return NextResponse.json({ error: 'Módulo Fiscal disponível a partir do plano Pro.' }, { status: 403 });
  }

  if (process.env.NFE_EXTERNAL_ENABLED !== 'true') {
    return NextResponse.json({ hasCertificate: false, disabled: true });
  }

  try {
    const status = await getCertificateStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Erro ao consultar certificado.' },
      { status: err.statusCode ?? 500 }
    );
  }
}

// ── POST /api/fiscal/certificate — upload/renovação de certificado ───────────
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await getSubscription(auth.tenantId);
  if (!planAtLeast(sub?.plan ?? 'free', 'pro')) {
    return NextResponse.json({ error: 'Módulo Fiscal disponível a partir do plano Pro.' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!body.pfxBase64 || typeof body.pfxBase64 !== 'string') {
    return NextResponse.json({ error: 'pfxBase64 é obrigatório.' }, { status: 400 });
  }
  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Senha do certificado é obrigatória.' }, { status: 400 });
  }

  if (process.env.NFE_EXTERNAL_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Integração fiscal não habilitada (NFE_EXTERNAL_ENABLED=false).' },
      { status: 503 }
    );
  }

  try {
    const result = await uploadCertificate(
      body.pfxBase64,
      body.password,
      body.company_id,
      body.label
    );

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        module: 'fiscal_cert',
        tenantId: auth.tenantId,
        thumbprint: result.thumbprint,
        validTo: result.validTo,
        msg: 'Certificado instalado via painel',
      })
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        module: 'fiscal_cert',
        tenantId: auth.tenantId,
        msg: 'Erro no upload de certificado',
        statusCode: err.statusCode,
        error: err.message,
      })
    );

    return NextResponse.json(
      { error: err.message ?? 'Erro ao instalar certificado.' },
      { status: err.statusCode ?? 500 }
    );
  }
}
