import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { decrypt } from '@/lib/utils/crypto';

// Map CustomTemplate DB record → Template shape used by the frontend
function customTemplateToShape(t: {
  name: string; category: string; language: string; body: string;
  header: string | null; footer: string | null; exampleVars: string[]; status: string;
}) {
  const placeholders = [...new Set((t.body.match(/\{\{\d+\}\}/g) || []))];
  return {
    name: t.name,
    category: t.category,
    language: t.language,
    status: t.status,
    body: t.body,
    header: t.header || '',
    footer: t.footer || '',
    buttons: [],
    placeholders,
    placeholderLabels: placeholders.map((_, i) => t.exampleVars[i] ? `Ex: ${t.exampleVars[i]}` : `Variável ${i + 1}`),
    isCustom: true,
  };
}

export const dynamic = 'force-dynamic';

// Templates-semente em PT-BR para demonstração e App Review da Meta.
// Devem existir na WABA para envio real.
const SEED_TEMPLATES = [
  {
    name: 'confirmacao_pedido',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'APPROVED',
    body: 'Olá {{1}}, seu pedido {{2}} foi confirmado. Obrigado pela compra!',
    header: 'Confirmação de Pedido',
    footer: 'Responda AJUDA para falar com um atendente.',
    buttons: [],
    placeholders: ['{{1}}', '{{2}}'],
    placeholderLabels: ['Nome do Cliente', 'Número do Pedido'],
  },
  {
    name: 'lembrete_agendamento',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'APPROVED',
    body: 'Olá {{1}}, este é um lembrete do seu agendamento em {{2}} às {{3}}. Responda SIM para confirmar.',
    header: 'Lembrete de Agendamento',
    footer: '',
    buttons: ['Confirmar', 'Reagendar'],
    placeholders: ['{{1}}', '{{2}}', '{{3}}'],
    placeholderLabels: ['Nome do Cliente', 'Data', 'Horário'],
  },
  {
    name: 'oferta_promocional',
    category: 'MARKETING',
    language: 'pt_BR',
    status: 'APPROVED',
    body: 'Oi {{1}}! 🎉 Temos uma oferta especial: {{2}}% de desconto na sua próxima compra! Use o código {{3}} no checkout.',
    header: 'Oferta Especial',
    footer: '',
    buttons: ['Ver Ofertas'],
    placeholders: ['{{1}}', '{{2}}', '{{3}}'],
    placeholderLabels: ['Nome do Cliente', 'Percentual de Desconto', 'Código Promocional'],
  },
];

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        whatsappToken: true,
        whatsappBusinessAccountId: true,
        whatsappConnection: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    const rawToken = tenant.whatsappConnection?.accessToken || tenant.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const wabaId = tenant.whatsappConnection?.wabaId || tenant.whatsappBusinessAccountId;

    let liveTemplates: any[] = [];

    if (token && wabaId) {
      try {
        const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?fields=name,category,language,status,components,rejected_reason`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();

          liveTemplates = (data.data || []).map((tpl: any) => {
            const bodyComponent = tpl.components?.find((c: any) => c.type === 'BODY');
            const headerComponent = tpl.components?.find((c: any) => c.type === 'HEADER');
            const footerComponent = tpl.components?.find((c: any) => c.type === 'FOOTER');
            const buttonComponents = tpl.components?.filter((c: any) => c.type === 'BUTTONS') || [];

            const bodyText = bodyComponent?.text || '';
            const headerText = headerComponent?.text || '';
            const footerText = footerComponent?.text || '';
            const buttons = buttonComponents.flatMap((bc: any) =>
              (bc.buttons || []).map((b: any) => b.text || b.url || '')
            );

            // Detectar placeholders {{1}}, {{2}}, etc.
            const placeholderMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
            const placeholders = [...new Set(placeholderMatches)];

            // Extrair exemplos como labels
            const examples = bodyComponent?.example?.body_text?.[0] || [];
            const placeholderLabels = placeholders.map((_: any, i: number) =>
              examples[i] ? `Ex: ${examples[i]}` : `Variável ${i + 1}`
            );

            return {
              name: tpl.name,
              category: tpl.category,
              language: tpl.language,
              status: tpl.status,
              body: bodyText,
              header: headerText,
              footer: footerText,
              buttons: buttons.filter(Boolean),
              placeholders,
              placeholderLabels,
              rejectedReason: tpl.rejected_reason || null,
            };
          });
        } else {
          console.warn('[Templates] Falha ao buscar templates da Meta, usando seeds');
        }
      } catch (fetchErr) {
        console.warn('[Templates] Erro ao buscar templates:', fetchErr);
      }
    }

    // Load APPROVED custom templates from DB
    const customTemplates = await prisma.customTemplate.findMany({
      where: { tenantId: auth.tenantId, status: 'APPROVED' },
    });

    // Merge: Meta live first, then seeds not already present, then custom not already present.
    // Custom templates are only eligible if they have a metaTemplateId (confirmed by Meta at
    // submission time). Locally-APPROVED templates without metaTemplateId were never acknowledged
    // by Meta and must not be presented as usable.
    const liveNames = new Set(liveTemplates.map((t: any) => t.name));
    const seedsToAdd = SEED_TEMPLATES.filter(s => !liveNames.has(s.name));
    const customToAdd = customTemplates
      .filter(c => !liveNames.has(c.name))
      .filter(c => {
        if (!c.metaTemplateId) {
          console.warn(`[Templates] Custom template "${c.name}" is APPROVED locally but has no metaTemplateId — not confirmed by Meta, skipping`);
          return false;
        }
        return true;
      })
      .map(customTemplateToShape);

    const allTemplates = [...liveTemplates, ...seedsToAdd, ...customToAdd];

    return NextResponse.json(allTemplates);
  } catch (error: any) {
    console.error('[Templates] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
