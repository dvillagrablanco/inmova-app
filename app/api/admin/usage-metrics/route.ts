import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '30';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Obtener métricas de uso por acción
    const moduleUsage = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        ...(companyId && { companyId }),
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Obtener actividad por empresa
    const companyActivity = await prisma.auditLog.groupBy({
      by: ['companyId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 20,
    });

    // Obtener información de las empresas más activas
    const companyIds = companyActivity.filter((c) => c.companyId).map((c) => c.companyId as string);

    const companies = await prisma.company.findMany({
      where: {
        id: {
          in: companyIds,
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const companiesMap = Object.fromEntries(companies.map((c) => [c.id, c]));

    const enrichedCompanyActivity = companyActivity.map((activity) => ({
      ...activity,
      company: activity.companyId ? companiesMap[activity.companyId] : null,
    }));

    // Obtener usuarios más activos
    const userActivity = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        ...(companyId && { companyId }),
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 20,
    });

    const userIds = userActivity.filter((u) => u.userId).map((u) => u.userId as string);

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const enrichedUserActivity = userActivity.map((activity) => ({
      ...activity,
      user: activity.userId ? usersMap[activity.userId] : null,
    }));

    return NextResponse.json({
      period: parseInt(period),
      moduleUsage: moduleUsage.map((m) => ({
        action: m.action,
        count: m._count.id,
      })),
      companyActivity: enrichedCompanyActivity,
      userActivity: enrichedUserActivity,
      modulesByCompany: [],
    });
  } catch (error) {
    logger.error('Error al obtener métricas de uso:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}
