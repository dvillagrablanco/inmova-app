import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const activeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalCompanies, activeCompanies, trialCompanies, inactiveCompanies, enterpriseCompanies] =
      await Promise.all([
        prisma.company.count({ where: { activo: true } }),
        prisma.company.count({
          where: {
            activo: true,
            estadoCliente: 'activo',
            updatedAt: { gte: activeThreshold },
          },
        }),
        prisma.company.count({
          where: {
            OR: [{ estadoCliente: 'prueba' }, { esEmpresaPrueba: true }],
          },
        }),
        prisma.company.count({
          where: { activo: true, updatedAt: { lt: activeThreshold } },
        }),
        prisma.company.count({
          where: {
            subscriptionPlan: { tier: 'ENTERPRISE' },
          },
        }),
      ]);

    const segments = [
      {
        id: 'all',
        name: 'Todos los Clientes',
        description: 'Todas las empresas registradas',
        count: totalCompanies,
        criteria: ['Todos los clientes activos'],
      },
      {
        id: 'active',
        name: 'Clientes Activos',
        description: 'Empresas con actividad en los últimos 30 días',
        count: activeCompanies,
        criteria: ['Plan activo', 'Actividad reciente'],
      },
      {
        id: 'trial',
        name: 'En Período de Prueba',
        description: 'Empresas en trial que no han convertido',
        count: trialCompanies,
        criteria: ['Plan trial'],
      },
      {
        id: 'expiring',
        name: 'Suscripción por Vencer',
        description: 'Empresas cuyo plan vence próximamente',
        count: 0,
        criteria: ['Renovación < 15 días'],
      },
      {
        id: 'inactive',
        name: 'Clientes Inactivos',
        description: 'Sin actividad en más de 30 días',
        count: inactiveCompanies,
        criteria: ['Sin actividad > 30 días'],
      },
      {
        id: 'enterprise',
        name: 'Plan Enterprise',
        description: 'Clientes con plan Enterprise',
        count: enterpriseCompanies,
        criteria: ['Plan = Enterprise'],
      },
    ];

    return NextResponse.json({ segments });
  } catch (error) {
    logger.error('[Notification Campaigns] Error loading segments', error);
    return NextResponse.json({ error: 'Error al cargar segmentos' }, { status: 500 });
  }
}
