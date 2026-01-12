import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';



export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7';
    const severity = searchParams.get('severity');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Obtener actividad de auditoría reciente
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Analizar logs para detectar patrones sospechosos
    const loginsByUser = auditLogs
      .filter(log => log.action === 'LOGIN')
      .reduce((acc: any, log) => {
        const key = log.userId;
        if (!acc[key]) {
          acc[key] = { success: 0, failed: 0, user: log.user };
        }
        if (log.changes?.includes('failed')) {
          acc[key].failed++;
        } else {
          acc[key].success++;
        }
        return acc;
      }, {});

    const suspiciousActivity = Object.entries(loginsByUser)
      .filter(([_, data]: [string, any]) => data.failed >= 3)
      .map(([userId, data]: [string, any]) => ({
        userId,
        failedAttempts: data.failed,
        user: data.user,
        severity: data.failed >= 10 ? 'critical' : data.failed >= 5 ? 'high' : 'medium',
      }));

    // Cambios recientes importantes
    const recentChanges = auditLogs
      .filter(log => ['UPDATE', 'DELETE'].includes(log.action))
      .slice(0, 20);

    const alerts: any[] = [
      ...suspiciousActivity.map(a => ({
        type: 'FAILED_LOGINS',
        severity: a.severity,
        data: a,
      })),
      ...recentChanges.map(c => ({
        type: 'AUDIT_CHANGE',
        severity: c.action === 'DELETE' ? 'high' : 'medium',
        data: c,
      })),
    ];

    if (severity) {
      const filteredAlerts = alerts.filter(a => a.severity === severity);
      const summary = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      };
      return NextResponse.json({
        summary,
        alerts: filteredAlerts,
        period: parseInt(period),
      });
    }

    const summary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };

    return NextResponse.json({
      summary,
      alerts: alerts.slice(0, 100),
      period: parseInt(period),
    });
  } catch (error) {
    logger.error('Error al obtener alertas de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}
