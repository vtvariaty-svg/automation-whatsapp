-- PAY1: Add transactional payment module
-- Creates TenantPaymentConfig, Payment, PaymentEvent tables
-- Extends Product, Order, Appointment with payment fields

-- 1. Extend Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'product';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;

-- 2. Create tenant_payment_configs table
CREATE TABLE IF NOT EXISTS "tenant_payment_configs" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tenantId"         TEXT NOT NULL,
    "provider"         TEXT NOT NULL DEFAULT 'asaas',
    "environment"      TEXT NOT NULL DEFAULT 'sandbox',
    "enabled"          BOOLEAN NOT NULL DEFAULT false,
    "apiKey"           TEXT NOT NULL,
    "webhookAuthToken" TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_payment_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_payment_configs_tenantId_key"
    ON "tenant_payment_configs"("tenantId");

ALTER TABLE "tenant_payment_configs"
    DROP CONSTRAINT IF EXISTS "tenant_payment_configs_tenantId_fkey";
ALTER TABLE "tenant_payment_configs"
    ADD CONSTRAINT "tenant_payment_configs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create payments table (no FKs to Order/Appointment yet — added after)
CREATE TABLE IF NOT EXISTS "payments" (
    "id"                 TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tenantId"           TEXT NOT NULL,
    "orderId"            TEXT,
    "appointmentId"      TEXT,
    "provider"           TEXT NOT NULL DEFAULT 'asaas',
    "providerPaymentId"  TEXT,
    "providerCustomerId" TEXT,
    "invoiceUrl"         TEXT,
    "pixCopiaECola"      TEXT,
    "pixQrCodeBase64"    TEXT,
    "status"             TEXT NOT NULL DEFAULT 'pending',
    "amount"             DOUBLE PRECISION NOT NULL,
    "currency"           TEXT NOT NULL DEFAULT 'BRL',
    "description"        TEXT,
    "customerName"       TEXT NOT NULL,
    "customerPhone"      TEXT NOT NULL,
    "customerEmail"      TEXT,
    "customerCpfCnpj"    TEXT,
    "dueDate"            TEXT NOT NULL,
    "billingType"        TEXT NOT NULL DEFAULT 'UNDEFINED',
    "paidAt"             TIMESTAMP(3),
    "failedAt"           TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_providerPaymentId_key"
    ON "payments"("providerPaymentId");

CREATE INDEX IF NOT EXISTS "payments_tenantId_status_idx"
    ON "payments"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "payments_tenantId_createdAt_idx"
    ON "payments"("tenantId", "createdAt");

ALTER TABLE "payments"
    DROP CONSTRAINT IF EXISTS "payments_tenantId_fkey";
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment → Order FK (Payment.orderId)
ALTER TABLE "payments"
    DROP CONSTRAINT IF EXISTS "payments_orderId_fkey";
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Payment → Appointment FK (Payment.appointmentId)
ALTER TABLE "payments"
    DROP CONSTRAINT IF EXISTS "payments_appointmentId_fkey";
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Add paymentId FK to Order (Order.paymentId → payments.id)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentId_key"
    ON "Order"("paymentId");

ALTER TABLE "Order"
    DROP CONSTRAINT IF EXISTS "Order_paymentId_fkey";
ALTER TABLE "Order"
    ADD CONSTRAINT "Order_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Add paymentId and paymentStatus to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_paymentId_key"
    ON "Appointment"("paymentId");

ALTER TABLE "Appointment"
    DROP CONSTRAINT IF EXISTS "Appointment_paymentId_fkey";
ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Create payment_events table
CREATE TABLE IF NOT EXISTS "payment_events" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
    "paymentId"        TEXT NOT NULL,
    "tenantId"         TEXT NOT NULL,
    "providerEventId"  TEXT NOT NULL,
    "eventType"        TEXT NOT NULL,
    "payload"          JSONB NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'processed',
    "errorMessage"     TEXT,
    "processedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- Unique on providerEventId = idempotency gate
CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_providerEventId_key"
    ON "payment_events"("providerEventId");

CREATE INDEX IF NOT EXISTS "payment_events_paymentId_idx"
    ON "payment_events"("paymentId");

CREATE INDEX IF NOT EXISTS "payment_events_tenantId_eventType_idx"
    ON "payment_events"("tenantId", "eventType");

ALTER TABLE "payment_events"
    DROP CONSTRAINT IF EXISTS "payment_events_paymentId_fkey";
ALTER TABLE "payment_events"
    ADD CONSTRAINT "payment_events_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
