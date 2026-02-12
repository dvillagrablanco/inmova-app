-- Extend AccountingCategory enum with granular categories for Rovida, Viroda and Vidaro
-- This migration adds new enum values to support detailed financial classification

-- Ingresos Rovida (por tipo de inmueble)
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_garaje';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_local';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_nave';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_oficina';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_edificio';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_vivienda';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_terreno';

-- Ingresos Viroda (por edificio)
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_silvela';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_reina';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_candelaria';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_pelayo';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_renta_tejada';

-- Ingresos Vidaro (holding)
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_servicios_intragrupo';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_beneficio_inversiones';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_dividendos';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_intereses';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_diferencias_cambio';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_enajenacion_participaciones';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'ingreso_subvencion';

-- Gastos extendidos (Rovida/Viroda/Vidaro)
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_personal';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_amortizacion';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_intragrupo';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_impuesto_sociedades';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_arrendamiento';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_suministros';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_profesionales';

-- Vidaro gastos especificos
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_comisiones_custodia';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_servicios_bancarios';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_alquiler_oficina';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_asesoria_fiscal';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_asesoria_legal';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_formacion';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_viajes';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_sueldos_salarios';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_seguridad_social';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_perdidas_inversiones';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_diferencias_cambio';
ALTER TYPE "AccountingCategory" ADD VALUE IF NOT EXISTS 'gasto_deterioro_participaciones';
