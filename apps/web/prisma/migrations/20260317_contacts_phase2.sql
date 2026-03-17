-- CONTACTS_MODULE_PHASE_2 migration
-- All changes are additive and backward-compatible.

-- ── 1. contacts: add tags array and customFields JSON ─────────────────────────

ALTER TABLE "contacts"
  ADD COLUMN IF NOT EXISTS "tags"         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- ── 2. contact_events table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contact_events" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT        NOT NULL,
  "contactId"  TEXT        NOT NULL,
  "type"       TEXT        NOT NULL,
  "title"      TEXT        NOT NULL,
  "metadata"   JSONB,
  "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "contact_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contact_events_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "contact_events_contactId_occurredAt_idx"
  ON "contact_events" ("contactId", "occurredAt" DESC);

CREATE INDEX IF NOT EXISTS "contact_events_tenantId_type_idx"
  ON "contact_events" ("tenantId", "type");

-- ── 3. contact_merges table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contact_merges" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT        NOT NULL,
  "survivorId" TEXT        NOT NULL,
  "mergedId"   TEXT        NOT NULL,
  "mergedBy"   TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "contact_merges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contact_merges_survivorId_fkey"
    FOREIGN KEY ("survivorId") REFERENCES "contacts"("id"),
  CONSTRAINT "contact_merges_mergedId_fkey"
    FOREIGN KEY ("mergedId")   REFERENCES "contacts"("id")
);

CREATE INDEX IF NOT EXISTS "contact_merges_tenantId_survivorId_idx"
  ON "contact_merges" ("tenantId", "survivorId");

CREATE INDEX IF NOT EXISTS "contact_merges_tenantId_mergedId_idx"
  ON "contact_merges" ("tenantId", "mergedId");
