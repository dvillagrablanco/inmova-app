import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Schema de validación para query params
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  level: z.enum(['info', 'warn', 'error', 'debug', 'all']).optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/system-logs
 * Obtiene logs del sistema desde AuditLog con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      level: searchParams.get('level'),
      source: searchParams.get('source'),
      search: searchParams.get('search'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, level, source, search, startDate, endDate } = queryResult.data;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Filtro por nivel (mapeamos action a nivel)
    if (level && level !== 'all') {
      const levelActions: Record<string, string[]> = {
        error: ['ERROR', 'FAILED', 'UNAUTHORIZED'],
        warn: ['WARNING', 'RATE_LIMIT', 'SUSPICIOUS'],
        info: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'],
        debug: ['DEBUG', 'SYSTEM'],
      };
      where.action = { in: levelActions[level] || [] };
    }

    // Filtro por source (entityType)
    if (source) {
      where.entityType = { contains: source, mode: 'insensitive' };
    }

    // Filtro por búsqueda
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { changes: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Ejecutar queries en paralelo
    const [logs, total, stats] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
      // Estadísticas de los últimos 24h
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _count: true,
      }),
    ]);

    // Transformar logs al formato esperado
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      level: getLogLevel(log.action),
      source: log.entityType || 'system',
      message: formatLogMessage(log),
      details: {
        action: log.action,
        entityId: log.entityId,
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      },
      user: log.user,
      company: log.company,
    }));

    // Calcular estadísticas
    const summary = {
      total24h: stats.reduce((sum, s) => sum + s._count, 0),
      errors: stats.filter(s => ['ERROR', 'FAILED'].includes(s.action)).reduce((sum, s) => sum + s._count, 0),
      warnings: stats.filter(s => ['WARNING', 'RATE_LIMIT'].includes(s.action)).reduce((sum, s) => sum + s._count, 0),
      info: stats.filter(s => !['ERROR', 'FAILED', 'WARNING', 'RATE_LIMIT'].includes(s.action)).reduce((sum, s) => sum + s._count, 0),
    };

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    logger.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs del sistema' },
      { status: 500 }
    );
  }
}

// Helpers
function getLogLevel(action: string): 'info' | 'warn' | 'error' | 'debug' {
  if (['ERROR', 'FAILED', 'UNAUTHORIZED'].includes(action)) return 'error';
  if (['WARNING', 'RATE_LIMIT', 'SUSPICIOUS'].includes(action)) return 'warn';
  if (['DEBUG', 'SYSTEM'].includes(action)) return 'debug';
  return 'info';
}

function formatLogMessage(log: any): string {
  const action = log.action?.toLowerCase() || 'unknown';
  const entity = log.entityType || 'registro';
  const user = log.user?.name || log.user?.email || 'Sistema';
  
  const messages: Record<string, string> = {
    login: `${user} inició sesión`,
    logout: `${user} cerró sesión`,
    create: `${user} creó ${entity}`,
    update: `${user} actualizó ${entity}`,
    delete: `${user} eliminó ${entity}`,
    view: `${user} visualizó ${entity}`,
    error: `Error en ${entity}: ${log.changes || 'Sin detalles'}`,
    failed: `Operación fallida: ${log.changes || 'Sin detalles'}`,
  };

  return messages[action] || `${action} - ${entity}`;
}
