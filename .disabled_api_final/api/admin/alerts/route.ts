import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      title: string;
      description: string;
      companyId?: string;
      companyName?: string;
      action?: string;
      actionUrl?: string;
    }> = [];

    // 1. Empresas que han superado límites de uso
    const companies = await prisma.company.findMany({
      where: { activo: true },
      include: {
        _count: {
          select: {
            users: true,
            buildings: true,
          },
        },
      },
    });

    companies.forEach((company) => {
      if (
        company.maxUsuarios &&
        company._count.users >= company.maxUsuarios
      ) {
        alerts.push({
          id: `users-limit-${company.id}`,
          type: 'warning',
          title: 'Límite de usuarios alcanzado',
          description: `${company.nombre} ha alcanzado el límite de ${company.maxUsuarios} usuarios`,
          companyId: company.id,
          companyName: company.nombre,
          action: 'Revisar',
          actionUrl: `/admin/clientes/${company.id}`,
        });
      }

      if (
        company.maxEdificios &&
        company._count.buildings >= company.maxEdificios
      ) {
        alerts.push({
          id: `buildings-limit-${company.id}`,
          type: 'warning',
          title: 'Límite de edificios alcanzado',
          description: `${company.nombre} ha alcanzado el límite de ${company.maxEdificios} edificios`,
          companyId: company.id,
          companyName: company.nombre,
          action: 'Revisar',
          actionUrl: `/admin/clientes/${company.id}`,
        });
      }
    });

    // 2. Empresas suspendidas
    const suspendedCompanies = await prisma.company.count({
      where: { estadoCliente: 'suspendido' },
    });

    if (suspendedCompanies > 0) {
      alerts.push({
        id: 'suspended-companies',
        type: 'error',
        title: 'Empresas suspendidas',
        description: `Hay ${suspendedCompanies} empresa(s) suspendida(s)`,
        action: 'Ver',
        actionUrl: '/admin/clientes?status=suspendido',
      });
    }

    // 3. Empresas en periodo de prueba próximas a vencer
    const trialCompanies = await prisma.company.findMany({
      where: {
        estadoCliente: 'prueba',
        createdAt: {
          lte: subDays(new Date(), 23), // Más de 23 días de prueba (quedan menos de 7)
        },
      },
    });

    trialCompanies.forEach((company) => {
      const daysSinceCreation = Math.floor(
        (Date.now() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = 30 - daysSinceCreation;

      alerts.push({
        id: `trial-ending-${company.id}`,
        type: 'warning',
        title: 'Periodo de prueba próximo a vencer',
        description: `${company.nombre} tiene ${daysRemaining} día(s) restante(s) de prueba`,
        companyId: company.id,
        companyName: company.nombre,
        action: 'Contactar',
        actionUrl: `/admin/clientes/${company.id}`,
      });
    });

    // 4. Actividad inusual (muchas eliminaciones en el último día)
    const oneDayAgo = subDays(new Date(), 1);
    const recentDeletions = await prisma.auditLog.count({
      where: {
        action: 'DELETE',
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (recentDeletions > 10) {
      alerts.push({
        id: 'unusual-deletions',
        type: 'warning',
        title: 'Actividad de eliminación inusual',
        description: `Se han registrado ${recentDeletions} eliminaciones en las últimas 24 horas`,
        action: 'Ver actividad',
        actionUrl: '/admin/activity',
      });
    }

    // 5. Empresas sin actividad reciente (más de 30 días)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const inactiveCompanies = await prisma.company.findMany({
      where: {
        activo: true,
        updatedAt: {
          lte: thirtyDaysAgo,
        },
      },
      take: 5,
    });

    inactiveCompanies.forEach((company) => {
      alerts.push({
        id: `inactive-${company.id}`,
        type: 'info',
        title: 'Empresa sin actividad reciente',
        description: `${company.nombre} no ha tenido actividad en más de 30 días`,
        companyId: company.id,
        companyName: company.nombre,
        action: 'Contactar',
        actionUrl: `/admin/clientes/${company.id}`,
      });
    });

    // Ordenar por tipo (error primero, luego warning, luego info)
    const typeOrder = { error: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        errors: alerts.filter((a) => a.type === 'error').length,
        warnings: alerts.filter((a) => a.type === 'warning').length,
        info: alerts.filter((a) => a.type === 'info').length,
      },
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}
