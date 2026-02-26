-- AlterTable: Add referenciaCatastral to Building and Unit
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "referenciaCatastral" TEXT;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "referenciaCatastral" TEXT;
