import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const parseTimeRange = (range: string | null) => {
  const now = new Date();
  switch (range) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '24h':
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
};

const mapSeverityToLevel = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'error':
      return 'error';
    case 'warning':
      return 'warn';
    case 'info':
    default:
      return 'info';
  }
};

const mapNotificationLevel = (estado: string) => {
  switch (estado) {
    case 'fallido':
      return 'error';
    case 'pendiente':
      return 'warn';
    default:
      return 'info';
  }
};

const mapEmailLevel = (status: string) => {
  switch (status) {
    case 'failed':
      return 'error';
    case 'pending':
      return 'warn';
    default:
      return 'info';
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const levelFilter = searchParams.get('level') || 'all';
    const sourceFilter = searchParams.get('source') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const timeRange = searchParams.get('timeRange') || '24h';

    const startDate = parseTimeRange(timeRange);
    const takePerSource = Math.max(limit * 3, 100);

    const [apiLogs, integrationLogs, securityEvents, emailLogs, notificationLogs] =
      await Promise.all([
        prisma.apiLog.findMany({
          where: { timestamp: { gte: startDate } },
          include: { company: { select: { id: true, nombre: true } } },
          orderBy: { timestamp: 'desc' },
          take: takePerSource,
        }),
        prisma.integrationLog.findMany({
          where: { createdAt: { gte: startDate } },
          include: { company: { select: { id: true, nombre: true } } },
          orderBy: { createdAt: 'desc' },
          take: takePerSource,
        }),
        prisma.securityEvent.findMany({
          where: { createdAt: { gte: startDate } },
          include: {
            company: { select: { id: true, nombre: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: takePerSource,
        }),
        prisma.emailLog.findMany({
          where: { createdAt: { gte: startDate } },
          include: {
            company: { select: { id: true, nombre: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: takePerSource,
        }),
        prisma.notificationLog.findMany({
          where: { enviadoEn: { gte: startDate } },
          include: {
            company: { select: { id: true, nombre: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { enviadoEn: 'desc' },
          take: takePerSource,
        }),
      ]);

    const logs = [
      ...apiLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        level: log.statusCode >= 500 ? 'error' : log.statusCode >= 400 ? 'warn' : 'info',
        source: 'api',
        message: `${log.method} ${log.path}`,
        userId: undefined,
        userName: undefined,
        companyId: log.companyId || undefined,
        companyName: log.company?.nombre,
        metadata: {
          statusCode: log.statusCode,
          responseTime: log.responseTime,
          ipAddress: log.ipAddress,
        },
        stackTrace: log.error || undefined,
      })),
      ...integrationLogs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        level: log.status === 'failed' ? 'error' : log.status === 'warning' ? 'warn' : 'info',
        source: 'integration',
        message: log.message || log.event,
        userId: undefined,
        userName: undefined,
        companyId: log.companyId,
        companyName: log.company?.nombre,
        metadata: log.requestData || log.responseData || undefined,
        stackTrace: log.errorDetails ? JSON.stringify(log.errorDetails) : undefined,
      })),
      ...securityEvents.map((event) => ({
        id: event.id,
        timestamp: event.createdAt.toISOString(),
        level: mapSeverityToLevel(event.severidad),
        source: 'auth',
        message: event.descripcion,
        userId: event.userId || undefined,
        userName: event.user?.name,
        companyId: event.companyId,
        companyName: event.company?.nombre,
        metadata: event.detalles || undefined,
        stackTrace: undefined,
      })),
      ...emailLogs.map((log) => ({
        id: log.id,
        timestamp: (log.sentAt || log.createdAt).toISOString(),
        level: mapEmailLevel(log.status),
        source: 'email',
        message: log.subject,
        userId: log.userId,
        userName: log.user?.name,
        companyId: log.companyId,
        companyName: log.company?.nombre,
        metadata: log.metadata || { to: log.to, template: log.template },
        stackTrace: log.error || undefined,
      })),
      ...notificationLogs.map((log) => ({
        id: log.id,
        timestamp: log.enviadoEn.toISOString(),
        level: mapNotificationLevel(log.estado),
        source: log.canal === 'email' ? 'email' : 'system',
        message: log.asunto || log.mensaje,
        userId: log.userId || undefined,
        userName: log.user?.name,
        companyId: log.companyId,
        companyName: log.company?.nombre,
        metadata: log.metadatos || undefined,
        stackTrace: log.errorMsg || undefined,
      })),
    ];

    const filtered = logs
      .filter((log) => (levelFilter === 'all' ? true : log.level === levelFilter))
      .filter((log) => (sourceFilter === 'all' ? true : log.source === sourceFilter))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const stats = filtered.reduce(
      (acc, log) => {
        acc.total += 1;
        if (log.level === 'error') acc.errors += 1;
        if (log.level === 'warn') acc.warnings += 1;
        if (log.level === 'info') acc.info += 1;
        if (log.level === 'debug') acc.debug += 1;
        acc.bySource[log.source] = (acc.bySource[log.source] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        debug: 0,
        bySource: {} as Record<string, number>,
        byHour: [] as { hour: string; count: number }[],
      }
    );

    const byHourMap = new Map<string, number>();
    filtered.forEach((log) => {
      const date = new Date(log.timestamp);
      const hourLabel = `${String(date.getHours()).padStart(2, '0')}:00`;
      byHourMap.set(hourLabel, (byHourMap.get(hourLabel) || 0) + 1);
    });
    stats.byHour = Array.from(byHourMap.entries()).map(([hour, count]) => ({ hour, count }));

    return NextResponse.json({
      logs: paginated,
      stats,
      pagination: {
        page: currentPage,
        totalPages,
        total,
        limit,
      },
    });
  } catch (error) {
    logger.error('[System Logs] Error loading logs', error);
    return NextResponse.json({ error: 'Error al cargar logs' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/admin-roles';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const whereClause: any = {};
    
    if (level !== 'all') {
      whereClause.action = { contains: level.toUpperCase() };
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
    const formattedLogs = filteredLogs.map((log) => ({
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
      metadata: log.details || {},
    }));

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
  } catch (error: any) {
    logger.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs' },
      { status: 500 }
    );
  }
}
