import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import os from 'os';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener métricas del sistema
    const [totalCompanies, totalUsers, totalBuildings, totalUnits] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.building.count(),
      prisma.unit.count(),
    ]);

    // Obtener intentos de login fallidos en las últimas 24 horas
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: 'LOGIN',
        changes: {
          contains: 'failed',
        },
        createdAt: {
          gte: yesterday,
        },
      },
    });

    // Obtener todas las empresas
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    // Métricas del servidor
    const systemMetrics = {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
    };

    // Verificar conexión a la base de datos
    let dbStatus = 'healthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'unhealthy';
      logger.error('Error de conexión a la base de datos:', error);
    }

    const healthData = {
      status: dbStatus === 'healthy' ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      metrics: {
        totalCompanies,
        totalUsers,
        totalBuildings,
        totalUnits,
        failedLogins,
      },
      companiesWithIssues: [],
      system: systemMetrics,
      database: {
        status: dbStatus,
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    logger.error('Error al obtener métricas de salud del sistema:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
