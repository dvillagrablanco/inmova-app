/**
 * API de Estadísticas - Datos reales de la base de datos
 * 
 * Obtiene métricas de propiedades, ocupación, ingresos y tendencias
 * desde la base de datos usando Prisma.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener el usuario y su empresa
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 });
    }

    const companyId = user.companyId;
    const now = new Date();

    // ============================================
    // ESTADÍSTICAS PRINCIPALES (KPIs)
    // ============================================
    
    // Total de propiedades (edificios)
    const totalProperties = await prisma.building.count({
      where: { companyId }
    });

    // Total de unidades
    const totalUnits = await prisma.unit.count({
      where: { building: { companyId } }
    });

    // Unidades ocupadas
    const occupiedUnits = await prisma.unit.count({
      where: {
        building: { companyId },
        estado: 'ocupada'
      }
    });

    // Tasa de ocupación
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Total de inquilinos activos (con contrato activo)
    const activeTenantsCount = await prisma.contract.count({
      where: {
        unit: { building: { companyId } },
        estado: 'activo'
      }
    });

    // Ingresos del mes actual
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const monthlyIncomeResult = await prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: { companyId }
          }
        },
        estado: 'pagado',
        fechaPago: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: { monto: true }
    });
    const monthlyIncome = Number(monthlyIncomeResult._sum.monto || 0);

    // Calcular cambios vs mes anterior
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const previousMonthUnits = await prisma.unit.count({
      where: {
        building: { companyId },
        createdAt: { lte: previousMonthEnd }
      }
    });

    const previousOccupiedUnits = await prisma.contract.count({
      where: {
        unit: { building: { companyId } },
        estado: 'activo',
        fechaInicio: { lte: previousMonthEnd }
      }
    });

    const previousOccupancyRate = previousMonthUnits > 0 ? (previousOccupiedUnits / previousMonthUnits) * 100 : 0;
    const occupancyChange = occupancyRate - previousOccupancyRate;

    const previousIncomeResult = await prisma.payment.aggregate({
      where: {
        contract: {
          unit: {
            building: { companyId }
          }
        },
        estado: 'pagado',
        fechaPago: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      },
      _sum: { monto: true }
    });
    const previousIncome = Number(previousIncomeResult._sum.monto || 0);
    const incomeChange = previousIncome > 0 ? ((monthlyIncome - previousIncome) / previousIncome) * 100 : 0;

    // ============================================
    // DATOS HISTÓRICOS (últimos 6 meses)
    // ============================================
    
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      return {
        date,
        mes: format(date, 'MMM', { locale: es }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    });

    const monthlyData = await Promise.all(
      last6Months.map(async ({ mes, startDate, endDate }) => {
        // Ingresos del mes
        const income = await prisma.payment.aggregate({
          where: {
            contract: {
              unit: {
                building: { companyId }
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

        // Contratos activos al final del mes para calcular ocupación
        const activeContractsInMonth = await prisma.contract.count({
          where: {
            unit: { building: { companyId } },
            estado: 'activo',
            fechaInicio: { lte: endDate },
            OR: [
              { fechaFin: { gte: endDate } },
              { fechaFin: null }
            ]
          }
        });

        // Total de unidades hasta ese mes
        const unitsInMonth = await prisma.unit.count({
          where: {
            building: { companyId },
            createdAt: { lte: endDate }
          }
        });

        const ocupacion = unitsInMonth > 0 ? Math.round((activeContractsInMonth / unitsInMonth) * 100) : 0;

        return {
          mes,
          ingresos: Number(income._sum.monto || 0),
          ocupacion
        };
      })
    );

    // ============================================
    // ESTADÍSTICAS POR TIPO DE PROPIEDAD
    // ============================================
    
    const buildingsByType = await prisma.building.groupBy({
      by: ['tipo'],
      where: { companyId },
      _count: { id: true }
    });

    const propertyTypes = await Promise.all(
      buildingsByType.map(async (group) => {
        const tipo = group.tipo || 'Otro';
        
        // Unidades de este tipo
        const unitsOfType = await prisma.unit.findMany({
          where: {
            building: {
              companyId,
              tipo: group.tipo
            }
          },
          select: {
            id: true,
            estado: true,
            rentaMensual: true
          }
        });

        const totalUnitsOfType = unitsOfType.length;
        const occupiedOfType = unitsOfType.filter(u => u.estado === 'ocupada').length;
        const ocupacion = totalUnitsOfType > 0 ? Math.round((occupiedOfType / totalUnitsOfType) * 100) : 0;
        const ingresos = unitsOfType
          .filter(u => u.estado === 'ocupada')
          .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);

        return {
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          count: totalUnitsOfType,
          ocupacion,
          ingresos
        };
      })
    );

    // ============================================
    // TOP PROPIEDADES (por ingresos)
    // ============================================
    
    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: {
        units: {
          select: {
            id: true,
            estado: true,
            rentaMensual: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const topProperties = buildings
      .map(building => {
        const totalUnits = building.units.length;
        const occupiedUnits = building.units.filter(u => u.estado === 'ocupada').length;
        const ocupacion = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
        const ingresos = building.units
          .filter(u => u.estado === 'ocupada')
          .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);

        return {
          nombre: building.nombre,
          unidades: totalUnits,
          ocupacion,
          ingresos
        };
      })
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    // ============================================
    // RESPUESTA
    // ============================================
    
    return NextResponse.json({
      success: true,
      data: {
        // KPIs principales
        stats: {
          totalProperties,
          totalUnits,
          occupiedUnits,
          occupancyRate: Number(occupancyRate.toFixed(1)),
          monthlyIncome,
          activeTenantsCount,
          changes: {
            properties: 0, // TODO: calcular cambio mensual
            occupancy: Number(occupancyChange.toFixed(1)),
            income: Number(incomeChange.toFixed(1)),
            tenants: 0 // TODO: calcular cambio mensual
          }
        },
        // Datos históricos
        monthlyData,
        // Por tipo de propiedad
        propertyTypes: propertyTypes.filter(p => p.count > 0),
        // Top propiedades
        topProperties
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API Error] Estadísticas:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
