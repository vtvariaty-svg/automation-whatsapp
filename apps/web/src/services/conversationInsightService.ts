import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { subDays, startOfDay } from 'date-fns';

const MAX_MESSAGES = 200;
const MSG_PREVIEW_LEN = 150;
const CACHE_TTL_HOURS = 6;

export interface InsightReport {
  commonQuestions: { topic: string; count: number; examples: string[] }[];
  commonObjections: { objection: string; count: number; examples: string[] }[];
  productInterests: { item: string; mentions: number }[];
  summary: string;
}

function getStartDate(period: string): Date {
  const now = new Date();
  if (period === '30days') return startOfDay(subDays(now, 30));
  return startOfDay(subDays(now, 7)); // default 7days
}

function isCacheValid(generatedAt: Date): boolean {
  const ageMs = Date.now() - generatedAt.getTime();
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000;
}

export async function getOrGenerateInsight(
  tenantId: string,
  period: string,
  forceRefresh = false
): Promise<InsightReport> {
  // Verificar cache
  if (!forceRefresh) {
    const cached = await prisma.conversationInsight.findUnique({
      where: { tenantId_period: { tenantId, period } }
    });
    if (cached && isCacheValid(cached.generatedAt)) {
      return cached.report as unknown as InsightReport;
    }
  }

  // Gerar novo relatório
  const report = await generateInsight(tenantId, period);

  // Upsert no cache
  await prisma.conversationInsight.upsert({
    where: { tenantId_period: { tenantId, period } },
    create: { tenantId, period, report: report as any },
    update: { report: report as any, generatedAt: new Date() }
  });

  return report;
}

async function generateInsight(tenantId: string, period: string): Promise<InsightReport> {
  const startDate = getStartDate(period);

  // 1. Buscar mensagens inbound dos clientes no período
  const conversations = await prisma.conversation.findMany({
    where: { tenantId },
    include: {
      messages: {
        where: {
          direction: 'inbound',
          role: 'user',
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_MESSAGES
      }
    }
  });

  const userMessages = conversations
    .flatMap(c => c.messages)
    .map(m => m.content.slice(0, MSG_PREVIEW_LEN).replace(/\n+/g, ' ').trim())
    .filter(m => m.length > 3);

  // 2. Buscar produtos do tenant para contextualizar detecção de interesse
  const products = await prisma.product.findMany({
    where: { tenantId },
    select: { name: true, category: true }
  });

  const productContext = products.length > 0
    ? `Produtos/serviços do negócio: ${products.map(p => p.name).join(', ')}.`
    : '';

  // 3. Sem mensagens suficientes — retornar relatório vazio
  if (userMessages.length < 3) {
    return {
      commonQuestions: [],
      commonObjections: [],
      productInterests: [],
      summary: 'Ainda não há mensagens suficientes para gerar um relatório de insights. Continue atendendo seus clientes e volte em breve.'
    };
  }

  // 4. Montar prompt compacto
  const messagesBlock = userMessages.slice(0, 200).join('\n');
  const periodLabel = period === '30days' ? '30 dias' : '7 dias';

  const prompt = `Você é um analista de negócios especializado em conversas de atendimento via WhatsApp.

Analise as mensagens abaixo enviadas por clientes nos últimos ${periodLabel} e retorne um JSON com os seguintes campos:

- "commonQuestions": array com as perguntas ou dúvidas mais frequentes. Cada item: { "topic": "resumo", "count": N, "examples": ["frase1", "frase2"] }
- "commonObjections": array com as principais objeções detectadas (ex: "está caro", "vou pensar"). Cada item: { "objection": "texto", "count": N, "examples": ["frase1"] }
- "productInterests": array de produtos, serviços ou categorias mais mencionados. Cada item: { "item": "nome", "mentions": N }
- "summary": parágrafo curto em português resumindo os principais padrões encontrados nas conversas

Regras:
- Retorne APENAS o JSON, sem texto extra
- Máximo 6 itens por categoria
- Agrupe perguntas similares em um único tópico
- Se não encontrar objeções claras, retorne array vazio
- Seja preciso e objetivo
${productContext}

MENSAGENS DOS CLIENTES:
${messagesBlock}`;

  // 5. Chamar OpenAI
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const openai = new OpenAI({ apiKey: tenant?.openaiKey || process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  const raw = response.choices[0].message.content || '{}';
  const parsed = JSON.parse(raw);

  return {
    commonQuestions: parsed.commonQuestions ?? [],
    commonObjections: parsed.commonObjections ?? [],
    productInterests: parsed.productInterests ?? [],
    summary: parsed.summary ?? 'Análise concluída.'
  };
}
