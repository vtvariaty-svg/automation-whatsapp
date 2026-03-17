-- CONTACTS_MODULE_PHASE_1 migration
-- Safe to run on existing database: all new columns are nullable,
-- all new FKs use ON DELETE SET NULL, no existing data is modified.

-- ── 1. contacts table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contacts" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"          TEXT NOT NULL,
  "phone"             TEXT,
  "normalizedPhone"   TEXT,
  "email"             TEXT,
  "name"              TEXT,
  "firstName"         TEXT,
  "lastName"          TEXT,
  "waId"              TEXT,
  "instagramScopedId" TEXT,
  "facebookScopedId"  TEXT,
  "status"            TEXT NOT NULL DEFAULT 'active',
  "source"            TEXT,
  "notes"             TEXT,
  "lastInteractionAt" TIMESTAMPTZ,
  "lastChannelUsed"   TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "contacts_tenantId_normalizedPhone_key"
    UNIQUE ("tenantId", "normalizedPhone")
);

CREATE INDEX IF NOT EXISTS "contacts_tenantId_status_idx"          ON "contacts" ("tenantId", "status");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_createdAt_idx"       ON "contacts" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_lastInteractionAt_idx" ON "contacts" ("tenantId", "lastInteractionAt");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_waId_idx"            ON "contacts" ("tenantId", "waId");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_instagramScopedId_idx" ON "contacts" ("tenantId", "instagramScopedId");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_facebookScopedId_idx" ON "contacts" ("tenantId", "facebookScopedId");
CREATE INDEX IF NOT EXISTS "contacts_tenantId_source_idx"          ON "contacts" ("tenantId", "source");

-- ── 2. Conversation.contactId (nullable FK) ────────────────────────────────────

ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "contactId" TEXT;

ALTER TABLE "Conversation"
  DROP CONSTRAINT IF EXISTS "Conversation_contactId_fkey";

ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Conversation_tenantId_contactId_idx"
  ON "Conversation" ("tenantId", "contactId");

-- ── 3. Order.contactId — promote to real FK ────────────────────────────────────
-- contactId column already exists (ORDERS_V2), add FK constraint

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_contactId_fkey";

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL;

-- ── 4. Appointment.contactId (nullable FK) ────────────────────────────────────

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "contactId" TEXT;

ALTER TABLE "Appointment"
  DROP CONSTRAINT IF EXISTS "Appointment_contactId_fkey";

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Appointment_tenantId_contactId_idx"
  ON "Appointment" ("tenantId", "contactId");

-- ── 5. CustomerMemory.realContactId (nullable FK to contacts) ─────────────────

ALTER TABLE "customer_memories"
  ADD COLUMN IF NOT EXISTS "realContactId" TEXT;

ALTER TABLE "customer_memories"
  DROP CONSTRAINT IF EXISTS "customer_memories_realContactId_fkey";

ALTER TABLE "customer_memories"
  ADD CONSTRAINT "customer_memories_realContactId_fkey"
    FOREIGN KEY ("realContactId") REFERENCES "contacts"("id") ON DELETE SET NULL;

ALTER TABLE "customer_memories"
  DROP CONSTRAINT IF EXISTS "customer_memories_realContactId_key";

ALTER TABLE "customer_memories"
  ADD CONSTRAINT "customer_memories_realContactId_key" UNIQUE ("realContactId");
