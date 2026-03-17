-- ORDERS_V2 Migration
-- Expands Order model with lifecycle, items, notes, timeline, and checkout integration

-- 1. Add new columns to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'BRL';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "externalPaymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

-- 2. Create unique index on externalPaymentRef for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS "Order_externalPaymentRef_key" ON "Order"("externalPaymentRef");

-- 3. Create additional indexes
CREATE INDEX IF NOT EXISTS "Order_tenantId_createdAt_idx" ON "Order"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_tenantId_contactId_idx" ON "Order"("tenantId", "contactId");
CREATE INDEX IF NOT EXISTS "Order_externalPaymentRef_idx" ON "Order"("externalPaymentRef");

-- 4. Create OrderItem table
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_orderId_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Create OrderStatusHistory table
CREATE TABLE IF NOT EXISTS "order_status_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");
ALTER TABLE "order_status_history" DROP CONSTRAINT IF EXISTS "order_status_history_orderId_fkey";
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Migrate legacy status values to new statuses
UPDATE "Order" SET "status" = 'draft' WHERE "status" = 'novo';
UPDATE "Order" SET "status" = 'processing' WHERE "status" IN ('confirmado', 'preparando', 'enviado');
UPDATE "Order" SET "status" = 'completed' WHERE "status" = 'finalizado';

-- 7. Populate subtotal from price for existing orders
UPDATE "Order" SET "subtotal" = "price" WHERE "subtotal" = 0 AND "price" > 0;

-- 8. Set updatedAt = createdAt for existing orders
UPDATE "Order" SET "updatedAt" = "createdAt";
