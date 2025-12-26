-- ============================================================================
-- MIGRACIÓN MANUAL DEL CRM AVANZADO
-- ============================================================================
-- Este archivo contiene el SQL para crear todas las tablas del CRM
-- Ejecuta este script en tu base de datos PostgreSQL si las migraciones
-- automáticas no funcionan.
--
-- Uso en Railway:
--   1. Ir a tu proyecto Railway
--   2. Click en PostgreSQL
--   3. Click en "Query"
--   4. Copiar y pegar este script
--   5. Ejecutar
--
-- O via psql:
--   psql $DATABASE_URL < scripts/generate-crm-migration.sql
-- ============================================================================

-- ENUMS
CREATE TYPE "CRMLeadSource" AS ENUM (
  'linkedin',
  'website',
  'referral',
  'cold_call',
  'email_campaign',
  'event',
  'partner',
  'organic',
  'paid_ads',
  'webinar'
);

CREATE TYPE "CRMLeadStatus" AS ENUM (
  'new',
  'contacted',
  'qualified',
  'negotiation',
  'won',
  'lost',
  'nurturing',
  'unresponsive'
);

CREATE TYPE "CRMLeadPriority" AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE "CompanySize" AS ENUM (
  'solopreneur',
  'micro',
  'small',
  'medium',
  'large',
  'enterprise'
);

CREATE TYPE "DealStage" AS ENUM (
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

-- TABLAS

-- crm_leads
CREATE TABLE IF NOT EXISTS "crm_leads" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  
  -- Información Personal
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "jobTitle" TEXT,
  
  -- Información de la Empresa
  "companyName" TEXT NOT NULL,
  "companyWebsite" TEXT,
  "companySize" "CompanySize",
  "industry" TEXT,
  "companyLinkedIn" TEXT,
  
  -- Ubicación
  "city" TEXT,
  "region" TEXT,
  "country" TEXT DEFAULT 'ES' NOT NULL,
  
  -- Estado del Lead
  "status" "CRMLeadStatus" DEFAULT 'new' NOT NULL,
  "source" "CRMLeadSource" DEFAULT 'website' NOT NULL,
  "priority" "CRMLeadPriority" DEFAULT 'medium' NOT NULL,
  "score" INTEGER DEFAULT 0 NOT NULL,
  
  -- Asignación
  "ownerId" TEXT,
  
  -- Fechas importantes
  "firstContactDate" TIMESTAMP,
  "lastContactDate" TIMESTAMP,
  "nextFollowUpDate" TIMESTAMP,
  
  -- Información adicional
  "notes" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "customFields" JSONB,
  
  -- LinkedIn Data
  "linkedInUrl" TEXT,
  "linkedInProfile" JSONB,
  
  -- Engagement
  "emailsSent" INTEGER DEFAULT 0 NOT NULL,
  "emailsOpened" INTEGER DEFAULT 0 NOT NULL,
  "emailsClicked" INTEGER DEFAULT 0 NOT NULL,
  "callsMade" INTEGER DEFAULT 0 NOT NULL,
  "meetingsHeld" INTEGER DEFAULT 0 NOT NULL,
  
  -- Calificación
  "budget" DOUBLE PRECISION,
  "authority" BOOLEAN DEFAULT false NOT NULL,
  "need" TEXT,
  "timeline" TEXT,
  
  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "convertedAt" TIMESTAMP,
  
  CONSTRAINT "crm_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_leads_companyId_idx" ON "crm_leads"("companyId");
CREATE INDEX IF NOT EXISTS "crm_leads_email_idx" ON "crm_leads"("email");
CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads"("status");
CREATE INDEX IF NOT EXISTS "crm_leads_ownerId_idx" ON "crm_leads"("ownerId");
CREATE INDEX IF NOT EXISTS "crm_leads_score_idx" ON "crm_leads"("score");
CREATE INDEX IF NOT EXISTS "crm_leads_source_idx" ON "crm_leads"("source");
CREATE INDEX IF NOT EXISTS "crm_leads_createdAt_idx" ON "crm_leads"("createdAt");

-- crm_deals
CREATE TABLE IF NOT EXISTS "crm_deals" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "leadId" TEXT,
  
  -- Información del Deal
  "title" TEXT NOT NULL,
  "description" TEXT,
  "value" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'EUR' NOT NULL,
  
  -- Pipeline
  "stage" "DealStage" DEFAULT 'prospecting' NOT NULL,
  "probability" INTEGER DEFAULT 10 NOT NULL,
  
  -- Fechas
  "expectedCloseDate" TIMESTAMP,
  "closedDate" TIMESTAMP,
  
  -- Asignación
  "ownerId" TEXT,
  
  -- Información adicional
  "lostReason" TEXT,
  "competitorInfo" TEXT,
  "notes" TEXT,
  
  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT "crm_deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "crm_deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "crm_deals_companyId_idx" ON "crm_deals"("companyId");
CREATE INDEX IF NOT EXISTS "crm_deals_leadId_idx" ON "crm_deals"("leadId");
CREATE INDEX IF NOT EXISTS "crm_deals_ownerId_idx" ON "crm_deals"("ownerId");
CREATE INDEX IF NOT EXISTS "crm_deals_stage_idx" ON "crm_deals"("stage");
CREATE INDEX IF NOT EXISTS "crm_deals_expectedCloseDate_idx" ON "crm_deals"("expectedCloseDate");

-- crm_activities
CREATE TABLE IF NOT EXISTS "crm_activities" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "leadId" TEXT,
  "dealId" TEXT,
  
  -- Tipo de actividad
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT,
  
  -- Resultado
  "outcome" TEXT,
  
  -- Participantes
  "performedBy" TEXT,
  
  -- Datos específicos
  "duration" INTEGER,
  "metadata" JSONB,
  
  -- Fechas
  "activityDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT "crm_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE,
  CONSTRAINT "crm_activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_activities_companyId_idx" ON "crm_activities"("companyId");
CREATE INDEX IF NOT EXISTS "crm_activities_leadId_idx" ON "crm_activities"("leadId");
CREATE INDEX IF NOT EXISTS "crm_activities_dealId_idx" ON "crm_activities"("dealId");
CREATE INDEX IF NOT EXISTS "crm_activities_performedBy_idx" ON "crm_activities"("performedBy");
CREATE INDEX IF NOT EXISTS "crm_activities_activityDate_idx" ON "crm_activities"("activityDate");
CREATE INDEX IF NOT EXISTS "crm_activities_type_idx" ON "crm_activities"("type");

-- crm_tasks
CREATE TABLE IF NOT EXISTS "crm_tasks" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "leadId" TEXT,
  
  -- Información de la tarea
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "priority" "CRMLeadPriority" DEFAULT 'medium' NOT NULL,
  
  -- Estado
  "completed" BOOLEAN DEFAULT false NOT NULL,
  "completedAt" TIMESTAMP,
  
  -- Asignación
  "assignedTo" TEXT,
  
  -- Fechas
  "dueDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Recordatorios
  "reminderSent" BOOLEAN DEFAULT false NOT NULL,
  
  CONSTRAINT "crm_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "crm_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_tasks_companyId_idx" ON "crm_tasks"("companyId");
CREATE INDEX IF NOT EXISTS "crm_tasks_leadId_idx" ON "crm_tasks"("leadId");
CREATE INDEX IF NOT EXISTS "crm_tasks_assignedTo_idx" ON "crm_tasks"("assignedTo");
CREATE INDEX IF NOT EXISTS "crm_tasks_dueDate_idx" ON "crm_tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "crm_tasks_completed_idx" ON "crm_tasks"("completed");

-- crm_pipelines
CREATE TABLE IF NOT EXISTS "crm_pipelines" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  
  -- Configuración del pipeline
  "name" TEXT NOT NULL,
  "stages" JSONB NOT NULL,
  "isDefault" BOOLEAN DEFAULT false NOT NULL,
  
  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT "crm_pipelines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_pipelines_companyId_idx" ON "crm_pipelines"("companyId");

-- crm_email_templates
CREATE TABLE IF NOT EXISTS "crm_email_templates" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  
  -- Template info
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  
  -- Personalización
  "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Uso
  "timesUsed" INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT "crm_email_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "crm_email_templates_companyId_idx" ON "crm_email_templates"("companyId");
CREATE INDEX IF NOT EXISTS "crm_email_templates_category_idx" ON "crm_email_templates"("category");

-- linkedin_scraping_jobs
CREATE TABLE IF NOT EXISTS "linkedin_scraping_jobs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  
  -- Job info
  "searchQuery" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "targetCount" INTEGER NOT NULL,
  
  -- Estado
  "status" TEXT NOT NULL,
  "progress" INTEGER DEFAULT 0 NOT NULL,
  "leadsFound" INTEGER DEFAULT 0 NOT NULL,
  "leadsImported" INTEGER DEFAULT 0 NOT NULL,
  
  -- Resultados
  "results" JSONB,
  "errorMessage" TEXT,
  
  -- Metadata
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT "linkedin_scraping_jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "linkedin_scraping_jobs_companyId_idx" ON "linkedin_scraping_jobs"("companyId");
CREATE INDEX IF NOT EXISTS "linkedin_scraping_jobs_status_idx" ON "linkedin_scraping_jobs"("status");
CREATE INDEX IF NOT EXISTS "linkedin_scraping_jobs_createdAt_idx" ON "linkedin_scraping_jobs"("createdAt");

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

SELECT 'CRM tables created successfully!' AS status;
