/**
 * Onboarding Blueprint Generator
 * Gera um checklist contextual baseado em plano + businessType + health atual.
 * Fonte de dados: MODULE_CATALOG (não hardcoded).
 */
import { MODULE_CATALOG } from './modules';
import type { SystemHealthResult } from '@/lib/onboarding/healthCheck';

export interface BlueprintStep {
  moduleId: string;
  label: string;
  description: string;
  href: string;
  required: boolean;
  completed: boolean;
}

// businessTypes orientados a agenda vs. vendas
const AGENDA_TYPES = new Set(['clínica', 'salão', 'estética', 'serviços locais']);
const SALES_TYPES  = new Set(['ecommerce', 'restaurante', 'infoproduto']);

/**
 * Retorna etapas de onboarding ordenadas e contextuais.
 * Plano `free` não recebe etapas de canal (WhatsApp) como obrigatórias.
 */
export function getOnboardingBlueprint(
  plan: string,
  businessType: string | null | undefined,
  health: SystemHealthResult,
): BlueprintStep[] {
  const bType = (businessType ?? 'outro').toLowerCase();
  const planSlug = plan ?? 'free';

  return MODULE_CATALOG
    .filter(m => m.onboarding !== undefined)
    .filter(m => {
      const ob = m.onboarding!;

      // Filtro por plano
      if (!ob.plans.includes('*') && !ob.plans.includes(planSlug)) return false;

      // Filtro por businessType (se a etapa limita tipos)
      if (ob.businessTypes) {
        // Se o businessType do tenant está na lista, inclui
        if (ob.businessTypes.includes(bType)) return true;
        // Se o businessType é genérico ('outro') e a lista inclui 'outro', inclui
        if (bType === 'outro' && ob.businessTypes.includes('outro')) return true;
        // Caso contrário, filtra
        return false;
      }

      return true;
    })
    .sort((a, b) => a.onboarding!.order - b.onboarding!.order)
    .map(m => ({
      moduleId: m.id,
      label: m.onboarding!.label,
      description: m.onboarding!.description,
      href: m.href,
      required: m.onboarding!.required,
      completed: resolveStepCompleted(m.id, health, bType),
    }));
}

function resolveStepCompleted(
  moduleId: string,
  health: SystemHealthResult,
  bType: string,
): boolean {
  switch (moduleId) {
    case 'channels':     return health.whatsapp_connected;
    case 'bots':         return health.ai_configured;
    case 'services':     return health.services_configured;
    case 'catalog':      return health.services_configured; // proxy: produtos = serviços no health check
    case 'conversations':return health.test_message_received;
    case 'appointments': return health.services_configured && health.whatsapp_connected;
    case 'orders':       return false; // sem check dedicado ainda
    case 'payments':     return false;
    case 'dashboard':    return true;
    default:             return false;
  }
}
