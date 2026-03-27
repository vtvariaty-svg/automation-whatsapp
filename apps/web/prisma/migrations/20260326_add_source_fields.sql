-- P1: source tracking for AutomationRule and Service
-- Distinguishes user-created records ("manual") from bot/preset-seeded records ("system")
-- Existing rows default to "manual" (safe — legacy records were never seeded by a bot)

ALTER TABLE "AutomationRule"
  ADD COLUMN IF NOT EXISTS "sourceType"   TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "sourceBotKey" TEXT;

ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "sourceType"   TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "sourceBotKey" TEXT;

-- Indexes for fast filtering on source tracking
CREATE INDEX IF NOT EXISTS "AutomationRule_tenantId_sourceType_idx"
  ON "AutomationRule" ("tenantId", "sourceType");

CREATE INDEX IF NOT EXISTS "Service_tenantId_sourceType_idx"
  ON "Service" ("tenantId", "sourceType");

-- Partial unique indexes: prevent duplicate system records per bot per tenant
-- These guard against race conditions on concurrent bot activations
CREATE UNIQUE INDEX IF NOT EXISTS "AutomationRule_system_unique_idx"
  ON "AutomationRule" (lower(btrim("triggerValue")), "tenantId", "triggerType", "matchType", "sourceBotKey")
  WHERE "sourceType" = 'system';

CREATE UNIQUE INDEX IF NOT EXISTS "Service_system_unique_idx"
  ON "Service" (lower(btrim("name")), "tenantId", "sourceBotKey")
  WHERE "sourceType" = 'system';
