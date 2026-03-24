import { prisma } from "@/lib/prisma";

export interface SystemHealthResult {
  whatsapp_connected: boolean;
  services_configured: boolean;
  ai_configured: boolean;
  automations_created: boolean;
  test_message_received: boolean;
  products_configured: boolean;
  orders_configured: boolean;
  payments_configured: boolean;
}

/**
 * Performs a full health check on a tenant's configuration.
 * Returns the status of each critical system component.
 */
export async function createSystemHealthCheck(tenantId: string): Promise<SystemHealthResult> {
  // 1. WhatsApp connected — check whatsapp_connections table
  const whatsappConn = await prisma.whatsAppConnection.findUnique({
    where: { tenantId },
  });
  const whatsapp_connected = !!(whatsappConn && whatsappConn.accessToken);

  // 2. Services configured — check services table
  const serviceCount = await prisma.service.count({
    where: { tenantId, active: true },
  });
  const services_configured = serviceCount > 0;

  // 3. AI configured — check tenant.aiPrompt (maps to ai_settings)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { aiPrompt: true },
  });
  const ai_configured = !!(tenant?.aiPrompt && tenant.aiPrompt.trim().length > 0);

  // 4. Automations created — check AutomationRule table
  const automationCount = await prisma.automationRule.count({
    where: { tenantId, active: true },
  });
  const automations_created = automationCount > 0;

  // 5. Test message received — check if any AI usage exists (proxy for messages processed)
  const aiUsageCount = await prisma.aiUsage.count({
    where: { tenantId },
  });
  const test_message_received = aiUsageCount > 0;

  // 6. Products configured — at least 1 active product
  const productCount = await prisma.product.count({
    where: { tenantId, active: true },
  });
  const products_configured = productCount > 0;

  // 7. Orders configured — at least 1 order received
  const orderCount = await prisma.order.count({
    where: { tenantId },
  });
  const orders_configured = orderCount > 0;

  // 8. Payments configured — payment gateway enabled
  const payConfig = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId },
    select: { enabled: true },
  }).catch(() => null);
  const payments_configured = payConfig?.enabled === true;

  return {
    whatsapp_connected,
    services_configured,
    ai_configured,
    automations_created,
    test_message_received,
    products_configured,
    orders_configured,
    payments_configured,
  };
}
