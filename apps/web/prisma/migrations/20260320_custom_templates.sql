-- Custom Templates: tenant-managed templates submitted to Meta for approval
CREATE TABLE IF NOT EXISTS "custom_templates" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"       TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "category"       TEXT NOT NULL DEFAULT 'UTILITY',
  "language"       TEXT NOT NULL DEFAULT 'pt_BR',
  "body"           TEXT NOT NULL,
  "header"         TEXT,
  "footer"         TEXT,
  "exampleVars"    TEXT[] NOT NULL DEFAULT '{}',
  "metaTemplateId" TEXT,
  "status"         TEXT NOT NULL DEFAULT 'DRAFT',
  "rejectedReason" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "custom_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "custom_templates_tenantId_name_key"
  ON "custom_templates" ("tenantId", "name");

CREATE INDEX IF NOT EXISTS "custom_templates_tenantId_status_idx"
  ON "custom_templates" ("tenantId", "status");
