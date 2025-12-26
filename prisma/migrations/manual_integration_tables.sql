-- Crear tablas de gestión de integraciones
CREATE TABLE IF NOT EXISTS "integration_configs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "credentials" TEXT NOT NULL,
  "settings" JSONB,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "isConfigured" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncAt" TIMESTAMP(3),
  "lastTestAt" TIMESTAMP(3),
  "testStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  CONSTRAINT "integration_configs_company_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "integration_configs_companyId_provider_key" ON "integration_configs"("companyId", "provider");
CREATE INDEX IF NOT EXISTS "integration_configs_companyId_idx" ON "integration_configs"("companyId");
CREATE INDEX IF NOT EXISTS "integration_configs_provider_idx" ON "integration_configs"("provider");
CREATE INDEX IF NOT EXISTS "integration_configs_category_idx" ON "integration_configs"("category");
CREATE INDEX IF NOT EXISTS "integration_configs_enabled_idx" ON "integration_configs"("enabled");

-- Crear tablas de logs de integraciones
CREATE TABLE IF NOT EXISTS "integration_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "integrationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT,
  "requestData" JSONB,
  "responseData" JSONB,
  "errorDetails" JSONB,
  "duration" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_logs_integration_fkey" FOREIGN KEY ("integrationId") REFERENCES "integration_configs"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_logs_company_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "integration_logs_integrationId_idx" ON "integration_logs"("integrationId");
CREATE INDEX IF NOT EXISTS "integration_logs_companyId_idx" ON "integration_logs"("companyId");
CREATE INDEX IF NOT EXISTS "integration_logs_event_idx" ON "integration_logs"("event");
CREATE INDEX IF NOT EXISTS "integration_logs_status_idx" ON "integration_logs"("status");
CREATE INDEX IF NOT EXISTS "integration_logs_createdAt_idx" ON "integration_logs"("createdAt");

-- Crear tabla de posts de Pomelli
CREATE TABLE IF NOT EXISTS "pomelli_social_posts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "pomelliConfigId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "pomelliPostId" TEXT,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "lastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pomelli_social_posts_company_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "pomelli_social_posts_config_fkey" FOREIGN KEY ("pomelliConfigId") REFERENCES "pomelli_configs"("id") ON DELETE CASCADE,
  CONSTRAINT "pomelli_social_posts_user_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "pomelli_social_posts_companyId_idx" ON "pomelli_social_posts"("companyId");
CREATE INDEX IF NOT EXISTS "pomelli_social_posts_userId_idx" ON "pomelli_social_posts"("userId");
CREATE INDEX IF NOT EXISTS "pomelli_social_posts_status_idx" ON "pomelli_social_posts"("status");
CREATE INDEX IF NOT EXISTS "pomelli_social_posts_scheduledAt_idx" ON "pomelli_social_posts"("scheduledAt");
CREATE INDEX IF NOT EXISTS "pomelli_social_posts_publishedAt_idx" ON "pomelli_social_posts"("publishedAt");

-- Crear tabla de relación entre posts y perfiles sociales
CREATE TABLE IF NOT EXISTS "_PostProfiles" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_PostProfiles_A_fkey" FOREIGN KEY ("A") REFERENCES "pomelli_social_posts"("id") ON DELETE CASCADE,
  CONSTRAINT "_PostProfiles_B_fkey" FOREIGN KEY ("B") REFERENCES "social_profiles"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "_PostProfiles_AB_unique" ON "_PostProfiles"("A", "B");
CREATE INDEX IF NOT EXISTS "_PostProfiles_B_index" ON "_PostProfiles"("B");
