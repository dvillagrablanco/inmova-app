import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodo = parseInt(searchParams.get('periodo') || '12');
    const buildingId = searchParams.get('buildingId') || '';
    const companyId = (session.user as any).companyId;

    const now = new Date();
    const startDate = subMonths(now, periodo);

    // Filtro de edificio
    const buildingFilter = buildingId ? { id: buildingId } : { companyId };

    // 1. Datos de Ingresos
    const ingresos: Array<{
      mes: string;
      rentas: number;
      servicios: number;
      otros: number;
    }> = [];
    for (let i = 0; i < periodo; i++) {
      const monthStart = startOfMonth(subMonths(now, periodo - i - 1));
      const monthEnd = endOfMonth(monthStart);
      
      const payments = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: buildingFilter
            }
          },
          estado: 'pagado',
          fechaPago: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const rentas = payments.reduce((sum, p) => sum + p.monto, 0);
      
      ingresos.push({
        mes: format(monthStart, 'MMM yyyy', { locale: es }),
        rentas: parseFloat(rentas.toFixed(2)),
        servicios: parseFloat((rentas * 0.05).toFixed(2)), // 5% en servicios
        otros: parseFloat((rentas * 0.02).toFixed(2)) // 2% otros
      });
    }

    // 2. Datos de Gastos
    const gastos: Array<{categoria: string; monto: number; porcentaje: number}> = [];
    const gastosPorCategoria: Record<string, number> = {};
    
    const allGastos = await prisma.expense.findMany({
      where: {
        building: buildingFilter,
        fecha: {
          gte: startDate
        }
      }
    });

    allGastos.forEach((gasto: any) => {
      if (!gastosPorCategoria[gasto.categoria]) {
        gastosPorCategoria[gasto.categoria] = 0;
      }
      gastosPorCategoria[gasto.categoria] += gasto.monto;
    });

    const totalGastos = Object.values(gastosPorCategoria).reduce((sum: any, val: any) => sum + val, 0) as number;

    Object.entries(gastosPorCategoria).forEach(([categoria, monto]: [string, any]) => {
      gastos.push({
        categoria,
        monto: parseFloat(monto.toFixed(2)),
        porcentaje: parseFloat(((monto / totalGastos) * 100).toFixed(1))
      });
    });

    // 3. Datos de Ocupación
    const buildings = await prisma.building.findMany({
      where: buildingFilter,
      include: {
        units: {
          include: {
            contracts: {
              where: {
                OR: [
                  { estado: 'activo' },
                  {
                    AND: [
                      { fechaInicio: { lte: now } },
                      { fechaFin: { gte: now } }
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    });

    const ocupacion = buildings.map((building: any) => {
      const totalUnits = building.units.length;
      const occupiedUnits = building.units.filter((unit: any) => unit.contracts.length > 0).length;
      const porcentaje = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      return {
        edificio: building.nombre,
        total: totalUnits,
        ocupadas: occupiedUnits,
        porcentaje: parseFloat(porcentaje.toFixed(1))
      };
    });

    // 4. Datos de Morosidad
    const morosidad: Array<{
      mes: string;
      morosidad: number;
      recuperado: number;
    }> = [];
    for (let i = 0; i < periodo; i++) {
      const monthStart = startOfMonth(subMonths(now, periodo - i - 1));
      const monthEnd = endOfMonth(monthStart);
      
      const paymentsOverdue = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: buildingFilter
            }
          },
          fechaVencimiento: {
            gte: monthStart,
            lte: monthEnd
          },
          estado: 'pendiente'
        }
      });

      const paymentsPaid = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: buildingFilter
            }
          },
          fechaVencimiento: {
            gte: monthStart,
            lte: monthEnd
          },
          estado: 'pagado',
          fechaPago: {
            gt: monthEnd // Pagados con retraso
          }
        }
      });

      morosidad.push({
        mes: format(monthStart, 'MMM yyyy', { locale: es }),
        morosidad: parseFloat(paymentsOverdue.reduce((sum, p) => sum + p.monto, 0).toFixed(2)),
        recuperado: parseFloat(paymentsPaid.reduce((sum, p) => sum + p.monto, 0).toFixed(2))
      });
    }

    // 5. Datos de Rentabilidad
    const totalIngresos = ingresos.reduce((sum, item) => sum + item.rentas + item.servicios + item.otros, 0);
    const totalGastosCalculado = gastos.reduce((sum, item) => sum + item.monto, 0);
    const ingresosNetos = totalIngresos - totalGastosCalculado;
    
    const totalUnits = buildings.reduce((sum: number, b: any) => sum + b.units.length, 0);
    const occupiedUnits = buildings.reduce((sum: number, b: any) => 
      sum + b.units.filter((u: any) => u.contracts.length > 0).length, 0
    );
    const tasaOcupacion = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const totalMorosidad = morosidad.reduce((sum, item) => sum + item.morosidad, 0);
    const tasaMorosidad = totalIngresos > 0 ? (totalMorosidad / totalIngresos) * 100 : 0;

    const rentabilidad = {
      ingresosTotales: parseFloat(totalIngresos.toFixed(2)),
      gastosTotales: parseFloat(totalGastosCalculado.toFixed(2)),
      ingresosNetos: parseFloat(ingresosNetos.toFixed(2)),
      margenNeto: parseFloat(((ingresosNetos / totalIngresos) * 100).toFixed(2)),
      tasaOcupacion: parseFloat(tasaOcupacion.toFixed(1)),
      tasaMorosidad: parseFloat(tasaMorosidad.toFixed(1)),
      roiPromedio: parseFloat(((ingresosNetos / totalIngresos) * 100).toFixed(2))
    };

    // 6. Tendencias y Predicciones (simplificado)
    const tendencias = {
      data: ingresos.map((item, index) => ({
        periodo: item.mes,
        real: item.rentas,
        prediccion: index >= ingresos.length - 3 ? item.rentas * 1.08 : null
      }))
    };

    return NextResponse.json({
      ingresos,
      gastos,
      ocupacion,
      morosidad,
      rentabilidad,
      tendencias
    });
  } catch (error: any) {
    logger.error('Error en BI dashboard:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos de BI', details: error.message },
      { status: 500 }
    );
  }
}
