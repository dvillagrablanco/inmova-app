import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfDay, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // Últimos 30 días
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

    // Audit Logs stats
    const totalAuditLogs = await prisma.auditLog.count({
      where: { companyId },
    });

    const recentAuditLogs = await prisma.auditLog.count({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Security Events stats
    const totalSecurityEvents = await prisma.securityEvent.count({
      where: { companyId },
    });

    const criticalEvents = await prisma.securityEvent.count({
      where: {
        companyId,
        severidad: 'critical',
        resuelta: false,
      },
    });

    const unresolvedEvents = await prisma.securityEvent.count({
      where: {
        companyId,
        resuelta: false,
      },
    });

    // Audit Reports stats
    const totalReports = await prisma.auditReport.count({
      where: { companyId },
    });

    const recentReports = await prisma.auditReport.count({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Active users count
    const activeUsers = await prisma.user.count({
      where: {
        companyId,
        activo: true,
      },
    });

    // Top actions (from audit logs)
    const topActions = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 5,
    });

    // Events by severity
    const eventsBySeverity = await prisma.securityEvent.groupBy({
      by: ['severidad'],
      where: { companyId },
      _count: true,
    });

    return NextResponse.json({
      totalAuditLogs,
      recentAuditLogs,
      totalSecurityEvents,
      criticalEvents,
      unresolvedEvents,
      totalReports,
      recentReports,
      activeUsers,
      topActions: topActions.map((a) => ({
        action: a.action,
        count: a._count,
      })),
      eventsBySeverity: eventsBySeverity.map((e) => ({
        severidad: e.severidad,
        count: e._count,
      })),
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
