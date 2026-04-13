-- AlterEnum: add uso_empresa to UnitStatus
ALTER TYPE "UnitStatus" ADD VALUE 'uso_empresa';

-- Contract IVA fields
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "baseImponible" DOUBLE PRECISION;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "ivaPorcentaje" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "importeIva" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "rentaTotal" DOUBLE PRECISION;
