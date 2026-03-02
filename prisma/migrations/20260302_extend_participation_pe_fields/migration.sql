-- Extend Participation model with PE-specific fields for MdF reporting

-- Capital Management
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "capitalPendiente" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "valoracionActual" DOUBLE PRECISION;

-- Métricas PE
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "moic" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "irr" DOUBLE PRECISION;

-- Metadata PE
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "anoCompromiso" INTEGER;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "vehiculoInversor" TEXT;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "gestora" TEXT;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "fechaUltimaValoracion" TIMESTAMP(3);

-- Rentabilidad periodo
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "patrimonioInicioPeriodo" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "rentabilidadPeriodoEur" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "rentabilidadPeriodoPct" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "desembolsosPeriodo" DOUBLE PRECISION;
ALTER TABLE "participations" ADD COLUMN IF NOT EXISTS "reembolsosPeriodo" DOUBLE PRECISION;

-- Index para filtrar por vehículo
CREATE INDEX IF NOT EXISTS "participations_vehiculoInversor_idx" ON "participations"("vehiculoInversor");
