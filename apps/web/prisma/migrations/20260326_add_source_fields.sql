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
