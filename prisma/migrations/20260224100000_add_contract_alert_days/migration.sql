-- Company: Días de aviso configurable para expiración de contratos
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "contractExpirationAlertDays" INTEGER NOT NULL DEFAULT 30;

-- Rovida y Viroda: 60 días (2 meses)
UPDATE "company" SET "contractExpirationAlertDays" = 60 WHERE "nombre" ILIKE '%Rovida%';
UPDATE "company" SET "contractExpirationAlertDays" = 60 WHERE "nombre" ILIKE '%Viroda%';
