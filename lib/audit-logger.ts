// @ts-nocheck
/**
 * Centralized Audit Logger
 *
 * Records security-relevant events for compliance and forensics.
 * Writes to both console logger and database (when available).
 */

import logger from '@/lib/logger';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ACCOUNT_LOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_MARKED_PAID'
  | 'PAYMENT_DELETED'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_UPDATED'
  | 'CONTRACT_TERMINATED'
  | 'BUILDING_CREATED'
  | 'BUILDING_UPDATED'
  | 'BUILDING_DELETED'
  | 'UNIT_CREATED'
  | 'UNIT_UPDATED'
  | 'UNIT_DELETED'
  | 'TENANT_CREATED'
  | 'TENANT_UPDATED'
  | 'TENANT_DELETED'
  | 'INSURANCE_CREATED'
  | 'INSURANCE_UPDATED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_DOWNLOADED'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'ADMIN_ACTION'
  | 'PERMISSION_CHANGED'
  | 'PLAN_CHANGED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'SETTINGS_CHANGED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'CRON_EXECUTED'
  | 'WEBHOOK_RECEIVED'
  | 'OTHER';

export interface AuditEntry {
  action: AuditAction;
  userId?: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'info' | 'warning' | 'critical';
}

/**
 * Log an audit event
 * Writes to structured logger immediately.
 * Optionally writes to DB (non-blocking, fire-and-forget).
 */
export async function audit(entry: AuditEntry): Promise<void> {
  const severity = entry.severity || 'info';
  const logEntry = {
    audit: true,
    action: entry.action,
    userId: entry.userId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    details: entry.details,
    ip: entry.ipAddress,
    timestamp: new Date().toISOString(),
  };

  // Always log to structured logger
  if (severity === 'critical') {
    logger.error('[AUDIT:CRITICAL]', logEntry);
  } else if (severity === 'warning') {
    logger.warn('[AUDIT]', logEntry);
  } else {
    logger.info('[AUDIT]', logEntry);
  }

  // Try to write to DB (non-blocking)
  try {
    const { prisma } = await import('@/lib/db');
    if (prisma?.auditLog) {
      await prisma.auditLog
        .create({
          data: {
            userId: entry.userId || 'system',
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            details: entry.details || {},
            ipAddress: entry.ipAddress,
          },
        })
        .catch(() => {}); // Silent fail if DB not available
    }
  } catch {
    // DB not available, log already written to file
  }
}

/**
 * Extract IP from request headers
 */
export function getRequestIP(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Audit helper for API routes
 */
export function auditApiAction(
  action: AuditAction,
  userId: string,
  entityType: string,
  entityId: string,
  request?: Request,
  details?: Record<string, any>
): Promise<void> {
  return audit({
    action,
    userId,
    entityType,
    entityId,
    details,
    ipAddress: request ? getRequestIP(new Headers(request.headers)) : undefined,
    userAgent: request?.headers
      ? new Headers(request.headers).get('user-agent') || undefined
      : undefined,
  });
}
