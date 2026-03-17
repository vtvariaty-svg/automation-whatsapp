/**
 * SC1 – Support Copilot Knowledge Base
 * Static per-route descriptions + FAQ used as context in the system prompt.
 */

const PAGE_KNOWLEDGE: Record<string, string> = {
  '/dashboard': 'Dashboard principal: resumo do sistema com status do WhatsApp, total de conversas, mensagens do mês e taxa de resposta da IA. Exibe checklist de configuração para novos usuários.',

  '/dashboard/conversations': 'Inbox omnichannel. Lista conversas de WhatsApp, Instagram e Facebook. Filtros por canal. Clique em uma conversa para ver mensagens. "Assumir conversa" ativa modo humano, "Voltar para IA" retorna ao modo automático.',

  '/dashboard/sales': 'Pipeline de vendas Kanban: Novo Lead → Interessado → Checkout Enviado → Pago → Pós-venda. Oportunidades criadas pela IA ou manualmente. Arraste cards entre colunas para atualizar status.',

  '/dashboard/appointments': 'Agenda de agendamentos criados pela IA. Exibe data, horário, cliente e serviço. Status: Agendado → Confirmado → Concluído → Cancelado.',

  '/dashboard/orders': 'Pedidos recebidos via WhatsApp. Status: Novo → Confirmado → Preparando → Enviado → Finalizado.',

  '/dashboard/services': 'Catálogo de serviços para agendamento automático pela IA. Cadastre nome e duração. Ative/desative conforme disponibilidade.',

  '/dashboard/products': 'Catálogo de produtos com nome, preço, categoria e estoque. A IA usa esses dados nos atendimentos.',

  '/dashboard/integrations': 'Conexão de canais Meta. WhatsApp: Embedded Signup (recomendado) ou manual com WABA ID + Phone Number ID + Token. Instagram e Facebook: OAuth. Após conectar, clique "Ver Conversas" para testar.',

  '/dashboard/instagram-comments': 'Regras para comentários do Instagram. Trigger: palavra-chave, contém, intenção IA. Ações: responder comentário, enviar DM, ocultar, enroll em sequência. Escopo: global ou post específico. Fila de Moderação mostra comentários pendentes.',

  '/dashboard/ai': 'Configuração da IA: prompt personalizado, mensagem de boas-vindas, horário de atendimento. A IA só responde dentro do horário configurado. Fora do horário envia mensagem de ausência automática.',

  '/dashboard/automations': 'Respostas rápidas por palavra-chave. Executam ANTES da IA — ideais para FAQs sem gastar tokens. Configure trigger (exato ou contém) e resposta.',

  '/dashboard/templates': 'Templates aprovados pela Meta para mensagens proativas (marketing, notificações). Preencha variáveis antes de enviar. Só templates com status APPROVED podem ser enviados.',

  '/dashboard/marketplace': 'Bots prontos por nicho (imobiliária, clínica, e-commerce, salão). Ativar um bot cria automações e configura a IA automaticamente.',

  '/dashboard/insights': 'Análise das conversas: perguntas frequentes, objeções comuns, interesses em produtos. Gerado por IA nos últimos 7 ou 30 dias. Clique em "Atualizar" para nova análise.',

  '/dashboard/analytics': 'Métricas: mensagens enviadas/recebidas, respostas IA vs humanos, novas conversas, agendamentos, funil de vendas. Períodos: hoje, 7 dias, 30 dias.',

  '/dashboard/billing': 'Assinatura. Planos: Starter (R$39,90/mês), Pro (R$79,90/mês), Business (R$149,00/mês). Trial de 7 dias com acesso completo. Após trial, é necessário assinar para continuar.',

  '/dashboard/settings': 'Configurações do negócio: nome, descrição, telefone, endereço, horário e nicho. "Aplicar nicho" configura automaticamente o prompt da IA e boas-vindas.',

  '/dashboard/activation': 'Métricas de ativação: canais, automações, mensagens, funil completo. Mostra se o tenant está na janela de ativação (primeiros 30 dias) e alertas de configuração.',

  '/dashboard/go-live': 'Checklist de go-live: canal conectado, automação ativa, billing válido, usuário configurado, setup completo. Clique "Ativar Produção" quando todos os itens estiverem verdes.',

  '/dashboard/attribution': 'Rastreamento de origem dos leads: Instagram DM, Comentário, Facebook, WhatsApp, Manual, Template. Primeiro toque vs último toque. Disponível no plano Pro+.',

  '/dashboard/referral': 'Programa de indicações. Gere link/código de referência. Configure recompensa (desconto, crédito ou comissão). Acompanhe conversões.',

  '/dashboard/onboarding': 'Wizard inicial: 1) conectar canal, 2) escolher nicho, 3) revisar template, 4) personalizar IA, 5) publicar. Complete todos os passos para ativar o atendimento automático.',

  '/dashboard/admin/diagnostics': '[SUPERADMIN] Diagnóstico de tenant: status de todos os módulos. Ações: reiniciar webhook, enviar mensagem de teste, exportar dados.',

  '/dashboard/admin/churn': '[SUPERADMIN] Sinais de churn e playbooks de retenção por tenant.',

  '/dashboard/admin/expansion': '[SUPERADMIN] Oportunidades de upsell: tenants com triggers de expansão (limite atingido, multichannel, volume alto).',

  '/dashboard/admin/retention': '[SUPERADMIN] Métricas de retenção e health score de todos os tenants.',

  '/dashboard/admin/ops': '[SUPERADMIN] Verificações operacionais: backup, dead letter, auditoria, incidentes.',
};

const GENERAL_FAQ = `
Perguntas frequentes do sistema:
- Como conectar WhatsApp? → Canais > WhatsApp > Embedded Signup ou inserir WABA ID + Phone Number ID + Token manualmente
- IA não responde? → Verificar: 1) canal conectado em Canais, 2) prompt em Configuração de IA, 3) horário de atendimento, 4) assinatura ativa
- Como assumir uma conversa? → Inbox > abrir conversa > "Assumir conversa". Para retornar: "Voltar para IA"
- Como criar automação? → Respostas Rápidas > Nova Automação > definir palavra-chave e resposta
- Como ver agendamentos? → Agenda no menu lateral
- Como ver pedidos? → Pedidos no menu lateral
- Como fazer upgrade? → Assinatura > clicar no plano desejado
- O que acontece quando o trial expira? → Sistema bloqueia novas mensagens. É necessário assinar um plano para continuar
- Como configurar a IA para meu nicho? → Configurações > Aplicar nicho (configuração automática) ou Configuração de IA (manual)
- Como responder comentários do Instagram automaticamente? → Comentários Instagram > Nova Regra > definir trigger e ação
- Como ver o funil de vendas? → Analytics > aba de métricas ou Vendas (Kanban)
- Como exportar dados? → [Superadmin] Admin > Diagnóstico > Exportar dados do tenant
`;

// ── SC5: Fast FAQ layer — instant answers without calling OpenAI ───────────────
// Returns a direct answer string if matched, or null if IA is needed.
const FAQ_INTENTS: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/conectar.*whatsapp|whatsapp.*conectar|ligar.*whatsapp/i],
    answer: 'Para conectar o WhatsApp: vá em **Canais** no menu lateral > clique em **WhatsApp** > use o **Embedded Signup** (recomendado) ou insira manualmente o WABA ID, Phone Number ID e Token de acesso.',
  },
  {
    patterns: [/ia.*não responde|não.*responde.*ia|bot.*não funciona|automação.*não.*dispara/i],
    answer: 'Se a IA não está respondendo, verifique: 1) Canal conectado em **Canais**; 2) Prompt configurado em **Configuração de IA**; 3) Horário de atendimento ativo; 4) Assinatura ativa em **Assinatura**.',
  },
  {
    patterns: [/assumir.*conversa|handoff|atendente.*humano|humano.*atender/i],
    answer: 'Para assumir uma conversa: abra a conversa no **Inbox** > clique em **"Assumir conversa"**. Para retornar à IA, clique em **"Voltar para IA"**.',
  },
  {
    patterns: [/criar.*automação|nova.*automação|automação.*keyword|resposta.*rápida/i],
    answer: 'Para criar uma automação: vá em **Respostas Rápidas** > **Nova Automação** > defina a palavra-chave e a resposta. As automações executam antes da IA.',
  },
  {
    patterns: [/comentário.*instagram|instagram.*comentário|comment.*rule/i],
    answer: 'Para configurar respostas a comentários do Instagram: vá em **Canais & IA > Comentários Instagram** > clique em **Nova Regra** > defina o trigger (palavra-chave, contém ou intenção IA) e as ações (responder, enviar DM, ocultar).',
  },
  {
    patterns: [/trial.*expira|expira.*trial|trial.*quanto|quanto.*trial/i],
    answer: 'O trial dura 7 dias com acesso completo a todas as features. Após expirar, o sistema bloqueia novas mensagens até que você assine um plano em **Assinatura**.',
  },
  {
    patterns: [/upgrade.*plano|mudar.*plano|trocar.*plano|assinar/i],
    answer: 'Para fazer upgrade: vá em **Assinatura** no menu > veja os planos disponíveis > clique no plano desejado para ir ao checkout.',
  },
  {
    patterns: [/onde.*leads|ver.*leads|pipeline.*vendas|kanban.*vendas/i],
    answer: 'Os leads e oportunidades de venda ficam em **Vendas** no menu lateral (Kanban com 5 estágios: Novo Lead → Interessado → Checkout Enviado → Pago → Pós-venda).',
  },
  {
    patterns: [/publicar.*automação|ativar.*bot|go.?live|colocar.*ar/i],
    answer: 'Para publicar/ativar: vá em **Go-Live** no menu > verifique o checklist (canal, automação, billing, setup) > clique em **"Ativar Produção"**.',
  },
  {
    patterns: [/agenda|agendamento|ver.*agendamento/i],
    answer: 'Os agendamentos ficam em **Agenda** no menu lateral. A IA cria agendamentos automaticamente via WhatsApp baseada nos serviços cadastrados.',
  },
  {
    patterns: [/pedido|ver.*pedido/i],
    answer: 'Os pedidos ficam em **Pedidos** no menu lateral. Você pode atualizar o status de cada pedido manualmente.',
  },
];

/**
 * SC5: Returns an instant FAQ answer if the question matches a known intent,
 * avoiding an OpenAI call. Returns null if IA processing is needed.
 */
export function getFaqAnswer(question: string): string | null {
  const q = question.trim();
  for (const intent of FAQ_INTENTS) {
    if (intent.patterns.some((p) => p.test(q))) {
      return intent.answer;
    }
  }
  return null;
}

export function getPageKnowledge(route: string): string {
  if (PAGE_KNOWLEDGE[route]) return PAGE_KNOWLEDGE[route];
  // Longest prefix match
  const prefix = Object.keys(PAGE_KNOWLEDGE)
    .filter((k) => route.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? PAGE_KNOWLEDGE[prefix] : '';
}

export { GENERAL_FAQ };
