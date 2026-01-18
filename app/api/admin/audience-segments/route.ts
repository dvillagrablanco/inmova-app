import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: string[];
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Calcular conteos reales desde la base de datos
    let totalCompanies = 0;
    let activeCompanies = 0;
    let trialCompanies = 0;
    let expiringCompanies = 0;
    let inactiveCompanies = 0;
    let enterpriseCompanies = 0;

    try {
      // Total de empresas
      totalCompanies = await prisma.company.count({
        where: { activo: true }
      });

      // Empresas activas (con login en últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      activeCompanies = await prisma.company.count({
        where: {
          activo: true,
          users: {
            some: {
              lastLogin: { gte: thirtyDaysAgo }
            }
          }
        }
      });

      // Empresas en trial
      trialCompanies = await prisma.company.count({
        where: {
          activo: true,
          estadoCliente: 'trial'
        }
      });

      // Empresas con suscripción por vencer (próximos 15 días)
      const fifteenDaysFromNow = new Date();
      fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
      
      expiringCompanies = await prisma.company.count({
        where: {
          activo: true,
          subscriptionEndDate: {
            lte: fifteenDaysFromNow,
            gte: new Date()
          }
        }
      });

      // Empresas inactivas (sin login en más de 30 días)
      inactiveCompanies = await prisma.company.count({
        where: {
          activo: true,
          OR: [
            {
              users: {
                every: {
                  lastLogin: { lt: thirtyDaysAgo }
                }
              }
            },
            {
              users: {
                every: {
                  lastLogin: null
                }
              }
            }
          ]
        }
      });

      // Empresas Enterprise
      enterpriseCompanies = await prisma.company.count({
        where: {
          activo: true,
          subscriptionPlan: {
            nombre: { contains: 'Enterprise', mode: 'insensitive' }
          }
        }
      });
    } catch (dbError) {
      // Si hay error de BD, usar valores por defecto
      logger.warn('Error consultando segmentos de audiencia:', dbError);
    }

    const segments: AudienceSegment[] = [
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
        criteria: ['Plan activo', 'Login en últimos 30 días'],
      },
      {
        id: 'trial',
        name: 'En Período de Prueba',
        description: 'Empresas en trial que no han convertido',
        count: trialCompanies,
        criteria: ['Plan trial', 'Sin pago registrado'],
      },
      {
        id: 'expiring',
        name: 'Suscripción por Vencer',
        description: 'Empresas cuyo plan vence en los próximos 15 días',
        count: expiringCompanies,
        criteria: ['Renovación < 15 días'],
      },
      {
        id: 'inactive',
        name: 'Clientes Inactivos',
        description: 'Sin login en más de 30 días',
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

    return NextResponse.json({
      segments,
      totalCompanies,
    });
  } catch (error) {
    logger.error('Error al obtener segmentos de audiencia:', error);
    return NextResponse.json(
      { error: 'Error al obtener segmentos' },
      { status: 500 }
    );
  }
}
