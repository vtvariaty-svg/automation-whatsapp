import { prisma } from "@/lib/prisma";
import { businessTemplates } from "./templates";

/**
 * Applies a business template to a tenant, inserting default services, automations, and generating AI prompt/knowledge base.
 */
export async function applyBusinessTemplate(tenantId: string, businessType: string, companyName: string, businessHours: string) {
  // Find matching template or fallback to 'outro'
  const template = businessTemplates[businessType] || businessTemplates["outro"];

  // 1. Insert Default Services
  // Only add if no services exist to prevent duplicates if user goes back and saves again
  const existingServicesCount = await prisma.service.count({ where: { tenantId } });
  
  if (existingServicesCount === 0 && template.defaultServices.length > 0) {
    const servicesToCreate = template.defaultServices.map(svc => ({
      tenantId,
      name: svc.name,
      durationMinutes: svc.durationMinutes,
      active: true,
    }));
    await prisma.service.createMany({ data: servicesToCreate });
  }

  // 2. Insert Default Automations
  const existingAuthsCount = await prisma.automationRule.count({ where: { tenantId } });
  
  if (existingAuthsCount === 0 && template.defaultAutomations.length > 0) {
    const rulesToCreate = template.defaultAutomations.map(rule => {
      // Replace placeholders
      let responseText = rule.responseText;
      if (responseText.includes("{business_hours}") && businessHours) {
        responseText = responseText.replace("{business_hours}", businessHours);
      } else if (responseText.includes("{business_hours}")) {
        responseText = responseText.replace("{business_hours}", "horário comercial padrão");
      }
      if (responseText.includes("{business_address}")) {
        responseText = responseText.replace("{business_address}", "endereço principal");
      }

      return {
        tenantId,
        name: rule.name,
        triggerType: rule.triggerType,
        triggerValue: rule.triggerValue,
        matchType: rule.matchType,
        responseType: rule.responseType,
        responseText: responseText,
        active: true,
      };
    });
    await prisma.automationRule.createMany({ data: rulesToCreate });
  }

  // 3. Update Tenant Knowledge Base and Default Prompt
  // Generate the prompt incorporating the template's guidelines
  const hoursText = businessHours || "horário comercial padrão";
  const systemPrompt = `${template.defaultPrompt}\n\nINFORMAÇÕES DA EMPRESA:\n- Nome: ${companyName}\n- Tipo: ${businessType}\n- Horário: ${hoursText}\n\n${template.defaultFaq ? `- FAQ: ${template.defaultFaq}\n\n` : ''}INSTRUÇÕES GERAIS:\nResponda de forma clara, amigável e sempre em português brasileiro de forma objetiva.`;

  const welcomeMessage = `Olá! 👋 Bem-vindo(a) à ${companyName}! Como posso ajudá-lo(a) hoje?`;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      aiPrompt: systemPrompt,
      welcomeMessage: welcomeMessage,
      businessDescription: template.defaultFaq ? template.defaultFaq : null,
    }
  });

  return { success: true, appliedTemplate: template.businessType };
}
