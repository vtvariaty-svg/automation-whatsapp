-- PAY-INT1: Add sourceType, contactId, conversationId to payments for integration traceability
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "sourceType"     TEXT NOT NULL DEFAULT 'standalone',
  ADD COLUMN IF NOT EXISTS "contactId"      TEXT,
  ADD COLUMN IF NOT EXISTS "conversationId" TEXT;

-- Indexes for contact and conversation payment lookups
CREATE INDEX IF NOT EXISTS "payments_tenantId_contactId_idx"      ON "payments" ("tenantId", "contactId");
CREATE INDEX IF NOT EXISTS "payments_tenantId_conversationId_idx" ON "payments" ("tenantId", "conversationId");
