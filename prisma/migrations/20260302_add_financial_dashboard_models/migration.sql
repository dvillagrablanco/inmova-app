-- Cuadro de Mandos Financiero - Migration
-- Adds CostCenter, PropertyValuationHistory models and extends Expense

-- CreateEnum: CostCenterType
DO $$ BEGIN
  CREATE TYPE "CostCenterType" AS ENUM ('directo', 'imputado', 'direccion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend ExpenseCategory enum with new values for PyG Analítica
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'arrendamientos_gasto';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'servicios_profesionales';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'transportes';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'servicios_bancarios';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'publicidad';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'suministros_luz';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'suministros_agua';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'suministros_gas';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'suministros_telefonia';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'suministros_otros';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'comisiones_gestion';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'ibi';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'basuras';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'tributos_otros';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'sueldos_salarios';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'seguridad_social';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'remuneraciones_consejeros';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'amortizaciones';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'enajenaciones';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'ingresos_financieros';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'intereses';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'comisiones_financieras';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'diferencias_cambio';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'beneficios_participaciones';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'perdidas_participaciones';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'extraordinarios';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'impuesto_sociedades';

-- CreateTable: cost_centers
CREATE TABLE IF NOT EXISTS "cost_centers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "CostCenterType" NOT NULL,
    "responsable" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_valuation_history
CREATE TABLE IF NOT EXISTS "property_valuation_history" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "ejercicio" INTEGER NOT NULL,
    "valorInversion" DOUBLE PRECISION NOT NULL,
    "valorMercado" DOUBLE PRECISION NOT NULL,
    "tasaDisponibilidad" DOUBLE PRECISION,
    "tasaOcupacion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_valuation_history_pkey" PRIMARY KEY ("id")
);

-- Add columns to expenses table
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "costCenterId" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "subcategoria" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "ejercicio" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cost_centers_companyId_codigo_key" ON "cost_centers"("companyId", "codigo");
CREATE INDEX IF NOT EXISTS "cost_centers_companyId_idx" ON "cost_centers"("companyId");

CREATE UNIQUE INDEX IF NOT EXISTS "property_valuation_history_unitId_ejercicio_key" ON "property_valuation_history"("unitId", "ejercicio");
CREATE INDEX IF NOT EXISTS "property_valuation_history_unitId_idx" ON "property_valuation_history"("unitId");
CREATE INDEX IF NOT EXISTS "property_valuation_history_ejercicio_idx" ON "property_valuation_history"("ejercicio");

CREATE INDEX IF NOT EXISTS "expenses_costCenterId_idx" ON "expenses"("costCenterId");
CREATE INDEX IF NOT EXISTS "expenses_ejercicio_idx" ON "expenses"("ejercicio");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "property_valuation_history" ADD CONSTRAINT "property_valuation_history_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "expenses" ADD CONSTRAINT "expenses_costCenterId_fkey"
    FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
