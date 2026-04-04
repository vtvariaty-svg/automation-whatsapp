-- BW1: Beauty Workspace — additive migration
-- Adds all Beauty Workspace tables and Appointment extensions.
-- All columns are nullable or have defaults — zero downtime.

-- ─── Appointment extensions ───────────────────────────────────────────────────
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "serviceId"        TEXT,
  ADD COLUMN IF NOT EXISTS "checkInAt"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "completedAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "attendanceStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "originFlow"       TEXT,
  ADD COLUMN IF NOT EXISTS "depositRequired"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "depositAmount"    DOUBLE PRECISION;

-- ─── BeautyWorkspaceConfig ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_workspace_configs" (
  "id"                    TEXT        NOT NULL PRIMARY KEY,
  "tenantId"              TEXT        NOT NULL UNIQUE REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "status"                TEXT        NOT NULL DEFAULT 'setup',
  "businessSubtype"       TEXT,
  "defaultDepositPercent" DOUBLE PRECISION,
  "depositRequired"       BOOLEAN     NOT NULL DEFAULT false,
  "reengagementDays"      INTEGER     NOT NULL DEFAULT 30,
  "confirmationLeadHours" INTEGER     NOT NULL DEFAULT 24,
  "reminderLeadHours"     INTEGER     NOT NULL DEFAULT 2,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BeautyServiceProfile ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_service_profiles" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "serviceId"       TEXT        NOT NULL UNIQUE REFERENCES "Service"("id") ON DELETE CASCADE,
  "category"        TEXT,
  "priceFrom"       DOUBLE PRECISION,
  "priceTo"         DOUBLE PRECISION,
  "requiresDeposit" BOOLEAN     NOT NULL DEFAULT false,
  "depositAmount"   DOUBLE PRECISION,
  "popularityScore" INTEGER     NOT NULL DEFAULT 0,
  "photoUrl"        TEXT,
  "description"     TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_service_profiles_tenantId_category_idx"
  ON "beauty_service_profiles"("tenantId", "category");

-- ─── BeautyCustomerProfile ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_customer_profiles" (
  "id"                    TEXT        NOT NULL PRIMARY KEY,
  "tenantId"              TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "contactId"             TEXT        NOT NULL UNIQUE REFERENCES "contacts"("id") ON DELETE CASCADE,
  "preferredProfessional" TEXT,
  "preferredServices"     TEXT[]      NOT NULL DEFAULT '{}',
  "notes"                 TEXT,
  "lastServiceAt"         TIMESTAMPTZ,
  "totalVisits"           INTEGER     NOT NULL DEFAULT 0,
  "totalSpend"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "birthdayDate"          TEXT,
  "loyaltyPoints"         INTEGER     NOT NULL DEFAULT 0,
  "vipStatus"             BOOLEAN     NOT NULL DEFAULT false,
  "reengagementSentAt"    TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_customer_profiles_tenantId_lastServiceAt_idx"
  ON "beauty_customer_profiles"("tenantId", "lastServiceAt");
CREATE INDEX IF NOT EXISTS "beauty_customer_profiles_tenantId_vipStatus_idx"
  ON "beauty_customer_profiles"("tenantId", "vipStatus");

-- ─── BeautyProfessionalProfile ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_professional_profiles" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "professionalId"  TEXT        NOT NULL UNIQUE REFERENCES "professionals"("id") ON DELETE CASCADE,
  "specialties"     TEXT[]      NOT NULL DEFAULT '{}',
  "commissionPct"   DOUBLE PRECISION,
  "photoUrl"        TEXT,
  "bio"             TEXT,
  "instagramHandle" TEXT,
  "rating"          DOUBLE PRECISION,
  "totalReviews"    INTEGER     NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_professional_profiles_tenantId_idx"
  ON "beauty_professional_profiles"("tenantId");

-- ─── BeautyPackage ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_packages" (
  "id"            TEXT        NOT NULL PRIMARY KEY,
  "tenantId"      TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name"          TEXT        NOT NULL,
  "description"   TEXT,
  "totalSessions" INTEGER     NOT NULL,
  "priceTotal"    DOUBLE PRECISION NOT NULL,
  "validityDays"  INTEGER     NOT NULL DEFAULT 90,
  "active"        BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_packages_tenantId_active_idx"
  ON "beauty_packages"("tenantId", "active");

-- ─── BeautyPackageItem ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_package_items" (
  "id"        TEXT    NOT NULL PRIMARY KEY,
  "packageId" TEXT    NOT NULL REFERENCES "beauty_packages"("id") ON DELETE CASCADE,
  "serviceId" TEXT    NOT NULL,
  "quantity"  INTEGER NOT NULL DEFAULT 1,
  UNIQUE("packageId", "serviceId")
);

-- ─── CustomerBeautyPackage ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "customer_beauty_packages" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL,
  "contactId"       TEXT        NOT NULL,
  "packageId"       TEXT        NOT NULL REFERENCES "beauty_packages"("id") ON DELETE RESTRICT,
  "beautyProfileId" TEXT        NOT NULL REFERENCES "beauty_customer_profiles"("id") ON DELETE CASCADE,
  "sessionsTotal"   INTEGER     NOT NULL,
  "sessionsUsed"    INTEGER     NOT NULL DEFAULT 0,
  "activatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt"       TIMESTAMPTZ,
  "status"          TEXT        NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS "customer_beauty_packages_beautyProfileId_status_idx"
  ON "customer_beauty_packages"("beautyProfileId", "status");

-- ─── BeautyPackageUsage ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_package_usages" (
  "id"             TEXT        NOT NULL PRIMARY KEY,
  "customerPkgId"  TEXT        NOT NULL REFERENCES "customer_beauty_packages"("id") ON DELETE CASCADE,
  "appointmentId"  TEXT,
  "usedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "notes"          TEXT
);
CREATE INDEX IF NOT EXISTS "beauty_package_usages_customerPkgId_idx"
  ON "beauty_package_usages"("customerPkgId");

-- ─── AppointmentLock ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "appointment_locks" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "professionalId"  TEXT,
  "date"            TEXT        NOT NULL,
  "time"            TEXT        NOT NULL,
  "durationMinutes" INTEGER     NOT NULL,
  "sessionId"       TEXT        NOT NULL,
  "expiresAt"       TIMESTAMPTZ NOT NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "appointment_locks_tenantId_date_time_idx"
  ON "appointment_locks"("tenantId", "date", "time");
CREATE INDEX IF NOT EXISTS "appointment_locks_expiresAt_idx"
  ON "appointment_locks"("expiresAt");

-- ─── BeautyWaitlistEntry ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_waitlist_entries" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "contactId"       TEXT,
  "serviceId"       TEXT,
  "professionalId"  TEXT,
  "preferredDate"   TEXT,
  "preferredTime"   TEXT,
  "status"          TEXT        NOT NULL DEFAULT 'waiting',
  "notifiedAt"      TIMESTAMPTZ,
  "bookedAt"        TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_waitlist_entries_tenantId_status_idx"
  ON "beauty_waitlist_entries"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "beauty_waitlist_entries_tenantId_preferredDate_idx"
  ON "beauty_waitlist_entries"("tenantId", "preferredDate");

-- ─── BeautyCampaignRule ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_campaign_rules" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "tenantId"        TEXT        NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name"            TEXT        NOT NULL,
  "triggerType"     TEXT        NOT NULL,
  "inactivityDays"  INTEGER,
  "messageTemplate" TEXT        NOT NULL,
  "channel"         TEXT        NOT NULL DEFAULT 'whatsapp',
  "active"          BOOLEAN     NOT NULL DEFAULT true,
  "cooldownDays"    INTEGER     NOT NULL DEFAULT 7,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "beauty_campaign_rules_tenantId_active_idx"
  ON "beauty_campaign_rules"("tenantId", "active");

-- ─── BeautyCampaignRun ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "beauty_campaign_runs" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "tenantId"  TEXT        NOT NULL,
  "ruleId"    TEXT        NOT NULL REFERENCES "beauty_campaign_rules"("id") ON DELETE CASCADE,
  "contactId" TEXT,
  "status"    TEXT        NOT NULL DEFAULT 'sent',
  "sentAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "repliedAt" TIMESTAMPTZ,
  "notes"     TEXT
);
CREATE INDEX IF NOT EXISTS "beauty_campaign_runs_ruleId_sentAt_idx"
  ON "beauty_campaign_runs"("ruleId", "sentAt");
CREATE INDEX IF NOT EXISTS "beauty_campaign_runs_tenantId_sentAt_idx"
  ON "beauty_campaign_runs"("tenantId", "sentAt");
