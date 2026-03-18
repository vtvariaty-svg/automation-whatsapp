-- FISCAL_INTEGRATION migration
-- Adds FiscalEmissionRecord table for persisting all emission attempts (real + mock).
-- Safe to run on existing database: new table only, no existing data modified.

CREATE TABLE IF NOT EXISTS "fiscal_emission_records" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"            TEXT NOT NULL,
  "externalReferenceId" TEXT NOT NULL,
  "invoiceId"           TEXT,
  "requestId"           TEXT,
  "protocol"            TEXT,
  "status"              TEXT NOT NULL,
  "rawStatus"           TEXT,
  "mode"                TEXT NOT NULL DEFAULT 'real',
  "tipo"                TEXT NOT NULL DEFAULT 'nfe',
  "customerNome"        TEXT NOT NULL,
  "customerDocumento"   TEXT NOT NULL,
  "total"               DOUBLE PRECISION NOT NULL DEFAULT 0,
  "itensJson"           TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fiscal_emission_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fiscal_emission_records_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "fiscal_emission_records_tenantId_createdAt_idx"
  ON "fiscal_emission_records"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "fiscal_emission_records_tenantId_externalReferenceId_idx"
  ON "fiscal_emission_records"("tenantId", "externalReferenceId");
