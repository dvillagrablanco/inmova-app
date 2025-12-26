import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { companyIds } = await request.json();

    if (!Array.isArray(companyIds) || companyIds.length < 2 || companyIds.length > 4) {
      return NextResponse.json(
        { error: 'Debe seleccionar entre 2 y 4 empresas para comparar' },
        { status: 400 }
      );
    }

    // Obtener datos completos de las empresas
    const companies = await prisma.company.findMany({
      where: {
        id: {
          in: companyIds,
        },
      },
      include: {
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
            providers: true,
            tasks: true,
          },
        },
        subscriptionPlan: {
          select: {
            id: true,
            nombre: true,
            precioMensual: true,
          },
        },
        users: {
          select: {
            role: true,
          },
        },
        buildings: {
          include: {
            _count: {
              select: {
                units: true,
              },
            },
          },
        },
      },
    });

    // Calcular métricas adicionales para cada empresa
    const comparisons = await Promise.all(
      companies.map(async (company) => {
        // Contar contratos activos
        const activeContracts = await prisma.contract.count({
          where: {
            unit: {
              building: {
                companyId: company.id,
              },
            },
            estado: 'activo',
          },
        });

        // Contar pagos del mes actual
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const monthlyPayments = await prisma.payment.findMany({
          where: {
            contract: {
              unit: {
                building: {
                  companyId: company.id,
                },
              },
            },
            fechaVencimiento: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            estado: 'pagado',
          },
          select: {
            monto: true,
          },
        });

        const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.monto, 0);

        // Contar unidades totales y ocupadas
        const totalUnits = company.buildings.reduce(
          (sum, building) => sum + building._count.units,
          0
        );

        const occupiedUnits = await prisma.unit.count({
          where: {
            building: {
              companyId: company.id,
            },
            estado: 'ocupada',
          },
        });

        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        // Módulos activos
        const activeModules = await prisma.companyModule.count({
          where: {
            companyId: company.id,
            activo: true,
          },
        });

        // Roles de usuarios
        const roleDistribution = company.users.reduce((acc: Record<string, number>, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});

        // Actividad reciente (acciónes en los últimos 7 días)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivity = await prisma.auditLog.count({
          where: {
            companyId: company.id,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        });

        // Porcentaje de límites usados
        const userLimitUsage = company.maxUsuarios
          ? (company._count.users / company.maxUsuarios) * 100
          : 0;
        const buildingLimitUsage = company.maxEdificios
          ? (company._count.buildings / company.maxEdificios) * 100
          : 0;

        return {
          id: company.id,
          nombre: company.nombre,
          activo: company.activo,
          estadoCliente: company.estadoCliente,
          createdAt: company.createdAt,
          tags: company.tags || [],
          contactoPrincipal: company.contactoPrincipal,
          emailContacto: company.emailContacto,
          subscriptionPlan: company.subscriptionPlan
            ? {
                id: company.subscriptionPlan.id,
                nombre: company.subscriptionPlan.nombre,
                precio: company.subscriptionPlan.precioMensual,
              }
            : null,
          metrics: {
            users: company._count.users,
            buildings: company._count.buildings,
            tenants: company._count.tenants,
            providers: company._count.providers,
            tasks: company._count.tasks,
            totalUnits,
            occupiedUnits,
            occupancyRate,
            activeContracts,
            monthlyRevenue,
            activeModules,
            recentActivity,
          },
          limits: {
            maxUsuarios: company.maxUsuarios,
            maxEdificios: company.maxEdificios,
            maxPropiedades: company.maxPropiedades,
            userLimitUsage,
            buildingLimitUsage,
          },
          roleDistribution,
        };
      })
    );

    return NextResponse.json({
      companies: comparisons,
    });
  } catch (error) {
    logger.error('Error comparing companies:', error);
    return NextResponse.json({ error: 'Error al comparar empresas' }, { status: 500 });
  }
}
