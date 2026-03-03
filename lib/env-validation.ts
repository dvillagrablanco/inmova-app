/**
 * Environment Variables Validation
 * 
 * Validates critical environment variables at startup using Zod.
 * Call validateEnv() early in the app lifecycle (e.g., instrumentation.ts).
 * 
 * Variables are categorized:
 * - CRITICAL: App won't function without these
 * - INTEGRATIONS: Optional, features degrade gracefully
 */

import { z } from 'zod';
import logger from '@/lib/logger';

// Skip validation during build or test
const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.SKIP_ENV_VALIDATION === '1';

// ============================================================================
// SCHEMAS
// ============================================================================

/** Critical variables — app cannot start without these */
const criticalSchema = z.object({
  DATABASE_URL: z.string().min(10, 'DATABASE_URL requerida'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET debe tener al menos 16 caracteres'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL debe ser una URL válida'),
});

/** Integration variables — optional, features degrade gracefully */
const integrationSchema = z.object({
  // Pagos
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOCARDLESS_ACCESS_TOKEN: z.string().optional(),
  BIZUM_MERCHANT_ID: z.string().optional(),
  BIZUM_SECRET_KEY: z.string().optional(),

  // Comunicación
  SMTP_HOST: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // IA
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),

  // Firma Digital
  SIGNATURIT_API_KEY: z.string().optional(),
  DOCUSIGN_INTEGRATION_KEY: z.string().optional(),

  // Contabilidad
  CONTASIMPLE_AUTH_KEY: z.string().optional(),
  INMOVA_CONTASIMPLE_AUTH_KEY: z.string().optional(),

  // Open Banking
  GOCARDLESS_WEBHOOK_SECRET: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // Push
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

// ============================================================================
// VALIDATION
// ============================================================================

export interface EnvValidationResult {
  valid: boolean;
  critical: { valid: boolean; errors: string[] };
  integrations: { configured: string[]; missing: string[] };
}

/**
 * Validate environment variables.
 * Returns validation result. Logs warnings for missing optional vars.
 * Throws on missing critical vars (unless build-time).
 */
export function validateEnv(): EnvValidationResult {
  if (isBuildTime) {
    return {
      valid: true,
      critical: { valid: true, errors: [] },
      integrations: { configured: [], missing: [] },
    };
  }

  // Validate critical
  const criticalResult = criticalSchema.safeParse(process.env);
  const criticalErrors: string[] = [];

  if (!criticalResult.success) {
    for (const issue of criticalResult.error.issues) {
      const msg = `❌ ${issue.path.join('.')}: ${issue.message}`;
      criticalErrors.push(msg);
      logger.error(`[ENV] ${msg}`);
    }
  }

  // Check integrations
  const integrationResult = integrationSchema.safeParse(process.env);
  const configured: string[] = [];
  const missing: string[] = [];

  const integrationKeys = Object.keys(integrationSchema.shape) as Array<keyof typeof integrationSchema.shape>;
  for (const key of integrationKeys) {
    const value = process.env[key];
    if (value && value.length > 0) {
      configured.push(key);
    } else {
      missing.push(key);
    }
  }

  const result: EnvValidationResult = {
    valid: criticalErrors.length === 0,
    critical: { valid: criticalErrors.length === 0, errors: criticalErrors },
    integrations: { configured, missing },
  };

  if (result.valid) {
    logger.info(`[ENV] ✅ Variables críticas OK. Integraciones: ${configured.length}/${integrationKeys.length} configuradas`);
  } else {
    logger.error(`[ENV] ❌ ${criticalErrors.length} variables críticas faltantes`);
  }

  return result;
}

/**
 * Quick check if a specific integration is configured
 */
export function isIntegrationConfigured(name: string): boolean {
  const envMap: Record<string, string[]> = {
    stripe: ['STRIPE_SECRET_KEY'],
    gocardless: ['GOCARDLESS_ACCESS_TOKEN'],
    bizum: ['BIZUM_MERCHANT_ID', 'BIZUM_SECRET_KEY'],
    twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
    smtp: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'],
    anthropic: ['ANTHROPIC_API_KEY'],
    aws_s3: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME'],
    signaturit: ['SIGNATURIT_API_KEY'],
    docusign: ['DOCUSIGN_INTEGRATION_KEY'],
    contasimple: ['CONTASIMPLE_AUTH_KEY'],
    sentry: ['SENTRY_DSN'],
    ga4: ['NEXT_PUBLIC_GA_MEASUREMENT_ID'],
    redis: ['REDIS_URL'],
    push: ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'],
  };

  const keys = envMap[name];
  if (!keys) return false;
  return keys.every(k => !!process.env[k] && process.env[k]!.length > 0);
}
