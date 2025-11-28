import { prisma } from './db';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';

interface LogAuditParams {
  companyId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const {
      companyId,
      userId,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      ipAddress,
      userAgent,
    } = params;

    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        entityName,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Error logging audit:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

export function getChangesSummary(oldData: any, newData: any): Record<string, any> {
  const changes: Record<string, any> = {};

  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  for (const key of allKeys) {
    // Skip internal fields
    if (['id', 'createdAt', 'updatedAt', 'password'].includes(key)) continue;

    const oldValue = oldData?.[key];
    const newValue = newData?.[key];

    // Only log if values are different
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue,
        to: newValue,
      };
    }
  }

  return changes;
}
