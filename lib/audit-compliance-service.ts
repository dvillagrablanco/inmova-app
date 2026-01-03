/**
 * Servicio de Audit Logs & Compliance
 * 
 * Sistema completo de auditoría y cumplimiento normativo:
 * - GDPR (Reglamento General de Protección de Datos)
 * - ISO 27001
 * - SOC 2
 * - Audit trail completo
 * - Data retention policies
 * - Right to be forgotten
 * 
 * @module AuditComplianceService
 */

import { prisma } from './db';
import logger from './logger';
import crypto from 'crypto';

// ============================================================================
// TIPOS
// ============================================================================

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'DATA_EXPORTED'
  | 'DATA_DELETED'
  | 'DOCUMENT_ACCESSED'
  | 'DOCUMENT_MODIFIED'
  | 'DOCUMENT_DELETED'
  | 'PAYMENT_PROCESSED'
  | 'CONTRACT_SIGNED'
  | 'PROPERTY_CREATED'
  | 'PROPERTY_DELETED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  | 'SECURITY_ALERT'
  | 'COMPLIANCE_CHECK';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId?: string;
  companyId?: string;
  entityType?: string; // 'Property', 'User', 'Document', etc
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface ComplianceReport {
  companyId: string;
  period: { start: Date; end: Date };
  gdpr: {
    dataAccessRequests: number;
    dataDeletionRequests: number;
    dataExports: number;
    breaches: number;
  };
  security: {
    loginAttempts: number;
    failedLogins: number;
    passwordChanges: number;
    securityAlerts: number;
  };
  dataRetention: {
    totalRecords: number;
    recordsExpired: number;
    recordsDeleted: number;
  };
  recommendations: string[];
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Registra evento de auditoría
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        companyId: entry.companyId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: entry.details,
        severity: entry.severity || 'low',
      },
    });

    // Si es critical, alertar
    if (entry.severity === 'critical') {
      logger.error('🚨 CRITICAL AUDIT EVENT', entry);
      // Aquí se podría enviar alerta por email/Slack
    }
  } catch (error: any) {
    logger.error('❌ Error logging audit event:', error);
  }
}

/**
 * Obtiene logs de auditoría con filtros
 */
export async function getAuditLogs(filters: {
  companyId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  page?: number;
  limit?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.companyId) where.companyId = filters.companyId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.severity) where.severity = filters.severity;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs: logs as any, total };
}

// ============================================================================
// GDPR COMPLIANCE
// ============================================================================

/**
 * Exporta todos los datos de un usuario (GDPR Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<Record<string, any>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        properties: true,
        contracts: true,
        payments: true,
        notifications: true,
        documents: true,
        savedSearches: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Audit log
    await logAuditEvent({
      action: 'DATA_EXPORTED',
      userId,
      companyId: user.companyId,
      severity: 'medium',
      details: { requestDate: new Date() },
    });

    // Anonimizar datos sensibles
    const userData = { ...user };
    delete (userData as any).password;

    return {
      personal: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        createdAt: userData.createdAt,
      },
      company: userData.company,
      properties: userData.properties,
      contracts: userData.contracts,
      payments: userData.payments,
      notifications: userData.notifications,
      documents: userData.documents,
      savedSearches: userData.savedSearches,
    };
  } catch (error: any) {
    logger.error('❌ Error exporting user data:', error);
    throw error;
  }
}

/**
 * Elimina permanentemente datos de usuario (GDPR Right to be Forgotten)
 */
export async function deleteUserDataPermanently(
  userId: string,
  reason: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Audit log ANTES de eliminar
    await logAuditEvent({
      action: 'DATA_DELETED',
      userId,
      companyId: user.companyId,
      severity: 'critical',
      details: { reason, deletedAt: new Date(), email: user.email },
    });

    // Eliminar en orden (respetando foreign keys)
    await prisma.$transaction([
      // 1. Notificaciones
      prisma.notification.deleteMany({ where: { userId } }),
      
      // 2. Document shares
      prisma.documentShare.deleteMany({ where: { sharedWithUserId: userId } }),
      
      // 3. Saved searches
      prisma.savedSearch.deleteMany({ where: { userId } }),
      
      // 4. Messages
      prisma.message.deleteMany({ where: { senderId: userId } }),
      
      // 5. AI usage logs
      prisma.aIUsageLog.deleteMany({ where: { userId } }),
      
      // 6. Finalmente, usuario
      prisma.user.delete({ where: { id: userId } }),
    ]);

    logger.warn('⚠️ USER DATA PERMANENTLY DELETED', { userId, reason });
  } catch (error: any) {
    logger.error('❌ Error deleting user data:', error);
    throw error;
  }
}

/**
 * Anonimiza datos de usuario (alternativa a eliminación)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const randomId = crypto.randomBytes(8).toString('hex');

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: `Anonymous-${randomId}`,
      email: `deleted-${randomId}@anonymized.local`,
      phone: null,
      password: crypto.randomBytes(32).toString('hex'),
      activo: false,
      deletedAt: new Date(),
    },
  });

  await logAuditEvent({
    action: 'DATA_DELETED',
    userId,
    severity: 'high',
    details: { type: 'anonymized' },
  });

  logger.info('✅ User data anonymized', { userId });
}

// ============================================================================
// DATA RETENTION
// ============================================================================

/**
 * Limpia datos antiguos según políticas de retención
 */
export async function cleanExpiredData(): Promise<{
  deleted: { auditLogs: number; notifications: number; sessions: number };
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const deleted = {
    auditLogs: 0,
    notifications: 0,
    sessions: 0,
  };

  try {
    // 1. Audit logs > 1 año (excepto críticos)
    const auditResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: oneYearAgo },
        severity: { not: 'critical' },
      },
    });
    deleted.auditLogs = auditResult.count;

    // 2. Notificaciones leídas > 90 días
    const notifResult = await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: ninetyDaysAgo },
      },
    });
    deleted.notifications = notifResult.count;

    // 3. Sessions expiradas > 30 días
    const sessionResult = await prisma.session.deleteMany({
      where: {
        expires: { lt: thirtyDaysAgo },
      },
    });
    deleted.sessions = sessionResult.count;

    logger.info('✅ Expired data cleaned', deleted);

    return { deleted };
  } catch (error: any) {
    logger.error('❌ Error cleaning expired data:', error);
    throw error;
  }
}

// ============================================================================
// COMPLIANCE REPORT
// ============================================================================

/**
 * Genera reporte de cumplimiento normativo
 */
export async function generateComplianceReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  try {
    // GDPR metrics
    const dataAccessRequests = await prisma.auditLog.count({
      where: {
        companyId,
        action: 'DATA_EXPORTED',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const dataDeletionRequests = await prisma.auditLog.count({
      where: {
        companyId,
        action: 'DATA_DELETED',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Security metrics
    const loginAttempts = await prisma.auditLog.count({
      where: {
        companyId,
        action: { in: ['USER_LOGIN', 'USER_LOGOUT'] },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const securityAlerts = await prisma.auditLog.count({
      where: {
        companyId,
        action: 'SECURITY_ALERT',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const passwordChanges = await prisma.auditLog.count({
      where: {
        companyId,
        action: 'PASSWORD_CHANGED',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Data retention
    const totalUsers = await prisma.user.count({ where: { companyId } });

    // Recommendations
    const recommendations: string[] = [];
    
    if (securityAlerts > 10) {
      recommendations.push('Alto número de alertas de seguridad. Revisar logs.');
    }
    
    if (passwordChanges / loginAttempts < 0.01) {
      recommendations.push('Bajo ratio de cambios de contraseña. Implementar política de rotación.');
    }

    if (dataDeletionRequests > 0) {
      recommendations.push('Requests de eliminación recibidas. Verificar cumplimiento GDPR.');
    }

    const report: ComplianceReport = {
      companyId,
      period: { start: startDate, end: endDate },
      gdpr: {
        dataAccessRequests,
        dataDeletionRequests,
        dataExports: dataAccessRequests,
        breaches: 0, // Implementar detección de breaches
      },
      security: {
        loginAttempts,
        failedLogins: 0, // Implementar tracking
        passwordChanges,
        securityAlerts,
      },
      dataRetention: {
        totalRecords: totalUsers,
        recordsExpired: 0,
        recordsDeleted: dataDeletionRequests,
      },
      recommendations,
    };

    logger.info('✅ Compliance report generated', { companyId });

    return report;
  } catch (error: any) {
    logger.error('❌ Error generating compliance report:', error);
    throw error;
  }
}

export default {
  logAuditEvent,
  getAuditLogs,
  exportUserData,
  deleteUserDataPermanently,
  anonymizeUserData,
  cleanExpiredData,
  generateComplianceReport,
};
