import { prisma } from "@/lib/prisma";
import { businessTemplates } from "./templates";

/**
 * Aplica o template de nicho ao tenant.
 *
 * forcePrompt = false (padrão — onboarding):
 *   - Serviços e automações só são criados se o tenant ainda não tiver nenhum
 *   - Prompt é sempre gravado (primeira configuração)
 *
 * forcePrompt = true (re-aplicar pelo painel de configurações):
 *   - Prompt é sempre atualizado
 *   - Serviços e automações existentes são preservados (não são apagados nem duplicados)
 *
 * welcomeMessage NÃO é escrita por esta função.
 * A mensagem de boas-vindas é de propriedade exclusiva do operador,
 * configurada na Central de Atendimento IA.
 */
export async function applyBusinessTemplate(
  tenantId: string,
  businessType: string,
  companyName: string,
  businessHours: string,
  forcePrompt = false
) {
  const template = businessTemplates[businessType] || businessTemplates["outro"];

  const hoursText = businessHours || "horário comercial padrão";

  // 1. Serviços padrão — só cria se não houver nenhum
  const existingServicesCount = await prisma.service.count({ where: { tenantId } });
  if (existingServicesCount === 0 && template.defaultServices.length > 0) {
    await prisma.service.createMany({
      data: template.defaultServices.map(svc => ({
        tenantId,
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        active: true,
      }))
    });
  }

  // 2. Automações padrão — só cria se não houver nenhuma
  const existingAutomationsCount = await prisma.automationRule.count({ where: { tenantId } });
  if (existingAutomationsCount === 0 && template.defaultAutomations.length > 0) {
    await prisma.automationRule.createMany({
      data: template.defaultAutomations.map(rule => {
        let responseText = rule.responseText
          .replace("{business_hours}", hoursText)
          .replace("{business_address}", "endereço principal");
        return {
          tenantId,
          name: rule.name,
          triggerType: rule.triggerType,
          triggerValue: rule.triggerValue,
          matchType: rule.matchType,
          responseType: rule.responseType,
          responseText,
          active: true,
        };
      })
    });
  }

  // 3. Prompt da IA — sempre atualiza (onboarding e re-apply)
  // welcomeMessage não é escrita aqui: é de propriedade exclusiva do operador.
  const systemPrompt = [
    template.defaultPrompt,
    "",
    "INFORMAÇÕES DA EMPRESA:",
    `- Nome: ${companyName}`,
    `- Tipo de negócio: ${businessType}`,
    `- Horário de atendimento: ${hoursText}`,
    "",
    "REGRA GERAL: Responda sempre em português brasileiro de forma clara e objetiva.",
  ].join("\n");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      aiPrompt: systemPrompt,
      businessType,
    }
  });

  return { success: true, appliedTemplate: template.businessType };
}
