-- Migration: add aiGuidedSetup Json column to Tenant
-- Run with: npx prisma db execute --file prisma/migrations/20260326_add_ai_guided_setup.sql --schema prisma/schema.prisma

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "aiGuidedSetup" JSONB;
