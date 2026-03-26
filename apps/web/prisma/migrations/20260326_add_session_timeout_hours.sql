-- Add sessionTimeoutHours to Tenant
-- Controls how long a customer session stays active before the next inbound
-- message is treated as a new session (welcome re-triggers, stale state is cleared).
-- Default: 24 hours. Range: 1–168 (1 hour to 1 week).
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "sessionTimeoutHours" INTEGER NOT NULL DEFAULT 24;
