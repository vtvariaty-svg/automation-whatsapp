-- PAY1: Add webhookId to tenant_payment_configs for auto-registration
ALTER TABLE "tenant_payment_configs" ADD COLUMN IF NOT EXISTS "webhookId" TEXT;
