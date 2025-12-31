-- AlterEnum: Cambiar SubscriptionTier de español a inglés
-- IMPORTANTE: Esta migración actualiza valores existentes en la BD

-- Paso 1: Renombrar enum temporalmente
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";

-- Paso 2: Crear nuevo enum con valores en inglés
CREATE TYPE "SubscriptionTier" AS ENUM ('basic', 'professional', 'business', 'enterprise');

-- Paso 3: Actualizar columnas que usan el enum
-- SubscriptionPlan.tier
ALTER TABLE "SubscriptionPlan" 
  ALTER COLUMN "tier" TYPE "SubscriptionTier" 
  USING (
    CASE "tier"::text
      WHEN 'basico' THEN 'basic'::text
      WHEN 'profesional' THEN 'professional'::text
      WHEN 'empresarial' THEN 'business'::text
      WHEN 'personalizado' THEN 'enterprise'::text
      ELSE 'basic'::text
    END
  )::"SubscriptionTier";

-- Paso 4: Eliminar enum antiguo
DROP TYPE "SubscriptionTier_old";

-- Nota: Esta migración NO se auto-ejecutará con prisma migrate deploy
-- Debe ejecutarse manualmente o mediante un script de datos
