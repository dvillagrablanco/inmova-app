-- Tenant: Datos bancarios, método de pago y dirección estructurada
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "iban" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "bic" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metodoPago" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "personaContacto" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "ciudad" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "codigoPostal" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "provincia" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "pais" TEXT DEFAULT 'España';

-- Payment: Desglose fiscal y trazabilidad
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "concepto" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "referencia" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "baseImponible" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "iva" DOUBLE PRECISION;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "irpf" DOUBLE PRECISION;

-- Contract: Datos contables y cargos adicionales
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "codigoOperacion" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "suministrosProvisionales" DOUBLE PRECISION;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "ibiRepercutido" DOUBLE PRECISION;

-- Índices para conciliación bancaria por IBAN
CREATE INDEX IF NOT EXISTS "tenants_iban_idx" ON "tenants"("iban");
CREATE INDEX IF NOT EXISTS "payments_referencia_idx" ON "payments"("referencia");
