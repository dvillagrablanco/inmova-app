import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // 1. KPIs principales
    // Total de propiedades
    const totalProperties = await prisma.building.count({
      where: { companyId: user.companyId }
    });

    // Total de unidades
    const totalUnits = await prisma.unit.count({
      where: { building: { companyId: user.companyId } }
    });

    // Unidades ocupadas
    const occupiedUnits = await prisma.unit.count({
      where: {
        building: { companyId: user.companyId },
        estado: 'ocupada'
      }
    });

    // Tasa de ocupación
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Ingresos del mes actual (pagos completados)
    const monthlyIncomeResult = await prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'pagado',
        fechaPago: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        }
      },
      _sum: {
        monto: true
      }
    });
    const monthlyIncome = monthlyIncomeResult._sum.monto || 0;

    // Pagos pendientes
    const pendingPaymentsResult = await prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'pendiente'
      },
      _sum: {
        monto: true
      }
    });
    const pendingPayments = pendingPaymentsResult._sum.monto || 0;
    const pendingPaymentsCount = await prisma.payment.count({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'pendiente'
      }
    });

    // Gastos del mes (expenses)
    const monthlyExpensesResult = await prisma.expense.aggregate({
      where: {
        OR: [
          {
            building: {
              companyId: user.companyId
            }
          },
          {
            unit: {
              building: {
                companyId: user.companyId
              }
            }
          }
        ],
        fecha: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        }
      },
      _sum: {
        monto: true
      }
    });
    const monthlyExpenses = monthlyExpensesResult._sum.monto || 0;

    // 2. Datos de gráficos - últimos 6 meses
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      return {
        date,
        month: format(date, 'MMM yyyy'),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    });

    // Ingresos y gastos por mes
    const monthlyData = await Promise.all(
      last6Months.map(async ({ month, startDate, endDate }) => {
        const income = await prisma.payment.aggregate({
          where: {
            contract: {
              unit: {
                building: {
                  companyId: user.companyId
                }
              }
            },
            estado: 'pagado',
            fechaPago: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: { monto: true }
        });

        const expenses = await prisma.expense.aggregate({
          where: {
            OR: [
              {
                building: {
                  companyId: user.companyId
                }
              },
              {
                unit: {
                  building: {
                    companyId: user.companyId
                  }
                }
              }
            ],
            fecha: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: { monto: true }
        });

        return {
          month,
          income: income._sum.monto || 0,
          expenses: expenses._sum.monto || 0,
          profit: (income._sum.monto || 0) - (expenses._sum.monto || 0)
        };
      })
    );

    // 3. Ocupación por propiedad (top 10)
    const buildings = await prisma.building.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            units: true
          }
        },
        units: {
          where: { estado: 'ocupada' },
          select: { id: true }
        }
      },
      take: 10,
      orderBy: { nombre: 'asc' }
    });

    const occupancyByProperty = buildings.map(building => ({
      name: building.nombre,
      totalUnits: building._count.units,
      occupiedUnits: building.units.length,
      occupancyRate: building._count.units > 0 
        ? ((building.units.length / building._count.units) * 100).toFixed(1)
        : 0
    }));

    // 4. Distribución de pagos
    const paymentsOnTime = await prisma.payment.count({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'pagado',
        fechaPago: {
          not: null
        }
      }
    });

    const paymentsLate = await prisma.payment.count({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'atrasado'
      }
    });

    const paymentsPending = await prisma.payment.count({
      where: {
        contract: {
          unit: {
            building: {
              companyId: user.companyId
            }
          }
        },
        estado: 'pendiente'
      }
    });

    const paymentDistribution = [
      { name: 'A tiempo', value: paymentsOnTime, color: '#10b981' },
      { name: 'Atrasados', value: paymentsLate, color: '#ef4444' },
      { name: 'Pendientes', value: paymentsPending, color: '#f59e0b' }
    ];

    // 5. Próximos vencimientos de contratos (30 días)
    const upcomingExpirations = await prisma.contract.findMany({
      where: {
        unit: {
          building: {
            companyId: user.companyId
          }
        },
        estado: 'activo',
        fechaFin: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días
        }
      },
      select: {
        id: true,
        fechaFin: true,
        unit: {
          select: {
            nombre: true,
            building: {
              select: { nombre: true }
            }
          }
        },
        tenant: {
          select: { nombre: true }
        }
      },
      orderBy: { fechaFin: 'asc' },
      take: 5
    });

    // 6. Propiedades con problemas (vacantes, mantenimiento urgente)
    const vacantUnits = await prisma.unit.findMany({
      where: {
        building: {
          companyId: user.companyId
        },
        estado: 'disponible'
      },
      select: {
        id: true,
        nombre: true,
        building: {
          select: { nombre: true }
        }
      },
      take: 5
    });

    const urgentMaintenance = await prisma.maintenanceRequest.count({
      where: {
        unit: {
          building: {
            companyId: user.companyId
          }
        },
        prioridad: 'urgente',
        estado: { notIn: ['completada', 'cancelada'] }
      }
    });

    return NextResponse.json({
      kpis: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        occupancyRate: occupancyRate.toFixed(1),
        monthlyIncome,
        monthlyExpenses,
        netProfit: monthlyIncome - monthlyExpenses,
        pendingPayments,
        pendingPaymentsCount,
        urgentMaintenance
      },
      charts: {
        monthlyData,
        occupancyByProperty,
        paymentDistribution
      },
      alerts: {
        upcomingExpirations: upcomingExpirations.map(c => ({
          id: c.id,
          property: `${c.unit.building.nombre} - ${c.unit.nombre}`,
          tenant: c.tenant.nombre,
          expirationDate: c.fechaFin,
          daysLeft: Math.ceil((c.fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        })),
        vacantUnits: vacantUnits.map(u => ({
          id: u.id,
          name: `${u.building.nombre} - ${u.nombre}`
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}
