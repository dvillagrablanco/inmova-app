import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/types/prisma-types';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type AuditActionValue =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT';

const isAuditAction = (value: string): value is AuditActionValue =>
  ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'].includes(value);

/**
 * GET /api/admin/system-logs
 * Obtiene logs del sistema - Solo Super Admin
 * IMPORTANTE: No incluye datos demo/mock
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    const source = searchParams.get('source') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener logs reales de la base de datos (audit logs)
    const whereClause: Prisma.AuditLogWhereInput = {};
    
    if (level !== 'all') {
      const actionFilter = level.toUpperCase();
      if (isAuditAction(actionFilter)) {
        whereClause.action = actionFilter;
      }
    }

    // Obtener logs de auditoría reales
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              nombre: true,
              esEmpresaPrueba: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    // Filtrar empresas de prueba de los logs
    const filteredLogs = logs.filter(log => !log.company?.esEmpresaPrueba);

    // Transformar a formato de LogEntry
    const formattedLogs = filteredLogs.map((log) => {
      let metadata: Record<string, unknown> = {};
      if (log.changes) {
        try {
          metadata = JSON.parse(log.changes);
        } catch {
          metadata = { raw: log.changes };
        }
      }

      return {
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      level: log.action?.includes('ERROR') ? 'error' : 
             log.action?.includes('WARN') ? 'warn' : 'info',
      source: log.entityType || 'system',
      message: `${log.action} - ${log.entityType} ${log.entityId || ''}`,
      userId: log.userId || undefined,
      userName: log.user?.name || log.user?.email || undefined,
      companyId: log.companyId || undefined,
      companyName: log.company?.nombre || undefined,
      metadata,
      };
    });

    // Calcular estadísticas reales
    const allLogs = await prisma.auditLog.findMany({
      where: {
        company: { esEmpresaPrueba: false },
      },
      select: {
        action: true,
        entityType: true,
        createdAt: true,
      },
    });

    const stats = {
      total: allLogs.length,
      errors: allLogs.filter(l => l.action?.includes('ERROR')).length,
      warnings: allLogs.filter(l => l.action?.includes('WARN')).length,
      info: allLogs.filter(l => !l.action?.includes('ERROR') && !l.action?.includes('WARN')).length,
      debug: 0,
      bySource: allLogs.reduce((acc, log) => {
        const source = log.entityType || 'system';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byHour: [], // Simplificado
    };

    return NextResponse.json({
      logs: formattedLogs,
      stats,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error fetching system logs:', { message });
    return NextResponse.json(
      { error: 'Error al obtener logs' },
      { status: 500 }
    );
  }
}
