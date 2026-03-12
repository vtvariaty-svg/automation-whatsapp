import { prisma } from '@/lib/prisma';

export async function getAutomations(tenantId: string) {
  return prisma.automationRule.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAutomation(tenantId: string, data: any) {
  return prisma.automationRule.create({
    data: {
      tenantId,
      name: data.name,
      triggerType: data.triggerType,
      triggerValue: data.triggerValue,
      matchType: data.matchType,
      responseType: data.responseType,
      responseText: data.responseText,
      active: data.active ?? true,
    }
  });
}

export async function updateAutomation(tenantId: string, id: string, data: any) {
  return prisma.automationRule.update({
    where: { id, tenantId },
    data
  });
}

export async function deleteAutomation(tenantId: string, id: string) {
  return prisma.automationRule.delete({
    where: { id, tenantId }
  });
}

export async function checkAutomationMatch(message: string, tenantId: string) {
  if (!message) return null;
  const msgText = message.toLowerCase().trim();

  const rules = await prisma.automationRule.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: 'asc' } // Process older rules first
  });

  for (const rule of rules) {
    const trigger = rule.triggerValue.toLowerCase().trim();
    
    if (rule.matchType === 'exact') {
      if (msgText === trigger) {
        return rule;
      }
    } else if (rule.matchType === 'contains') {
      if (msgText.includes(trigger)) {
        return rule;
      }
    }
  }

  return null;
}
