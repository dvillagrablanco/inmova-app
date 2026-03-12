-- Smart Suggestions System

DO $$ BEGIN CREATE TYPE "SuggestionArea" AS ENUM ('inmobiliario', 'financiero', 'operacional', 'fiscal'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SmartSuggestionStatus" AS ENUM ('pendiente', 'vista', 'aceptada', 'descartada', 'completada'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "smart_suggestions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "area" "SuggestionArea" NOT NULL,
    "prioridad" "SuggestionPriority" NOT NULL DEFAULT 'media',
    "estado" "SmartSuggestionStatus" NOT NULL DEFAULT 'pendiente',
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "accion" TEXT,
    "enlace" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "targetRole" TEXT,
    "targetUserId" TEXT,
    "notificadoInApp" BOOLEAN NOT NULL DEFAULT false,
    "notificadoEmail" BOOLEAN NOT NULL DEFAULT false,
    "fechaNotificacion" TIMESTAMP(3),
    "resueltoPor" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "notasResolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "smart_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smart_suggestions_companyId_estado_idx" ON "smart_suggestions"("companyId", "estado");
CREATE INDEX IF NOT EXISTS "smart_suggestions_companyId_area_idx" ON "smart_suggestions"("companyId", "area");
CREATE INDEX IF NOT EXISTS "smart_suggestions_prioridad_estado_idx" ON "smart_suggestions"("prioridad", "estado");
CREATE INDEX IF NOT EXISTS "smart_suggestions_createdAt_idx" ON "smart_suggestions"("createdAt");

DO $$ BEGIN
  ALTER TABLE "smart_suggestions" ADD CONSTRAINT "smart_suggestions_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
