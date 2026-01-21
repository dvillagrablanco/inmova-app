import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ResumenFinanciero {
  periodo: string;
  ingresos: {
    total: number;
    alquileres: number;
    servicios: number;
    otros: number;
    porCobrar: number;
  };
  gastos: {
    total: number;
    mantenimiento: number;
    servicios: number;
    impuestos: number;
    seguros: number;
    administracion: number;
    otros: number;
  };
  beneficioNeto: number;
  margenOperativo: number;
  ocupacion: {
    total: number;
    ocupadas: number;
    vacantes: number;
    porcentaje: number;
  };
  morosidad: {
    total: number;
    cantidad: number;
    porcentaje: number;
  };
  flujosCaja: Array<{
    mes: string;
    ingresos: number;
    gastos: number;
    neto: number;
  }>;
  propiedadesMasRentables: Array<{
    id: string;
    nombre: string;
    ingresos: number;
    gastos: number;
    roi: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes'; // mes, trimestre, año
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    // Calcular rango de fechas
    const ahora = new Date();
    let inicio: Date;
    let fin: Date = ahora;

    if (fechaInicio && fechaFin) {
      inicio = new Date(fechaInicio);
      fin = new Date(fechaFin);
    } else {
      switch (periodo) {
        case 'trimestre':
          inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
          break;
        case 'año':
          inicio = new Date(ahora.getFullYear(), 0, 1);
          break;
        case 'mes':
        default:
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }
    }

    // Obtener datos financieros de la BD
    let resumen: ResumenFinanciero;

    try {
      // 1. Obtener pagos del periodo
      const pagos = await prisma.payment.findMany({
        where: {
          contract: {
            unit: {
              building: {
                companyId: session.user.companyId,
              },
            },
          },
          fechaVencimiento: {
            gte: inicio,
            lte: fin,
          },
        },
        include: {
          contract: {
            include: {
              unit: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      });

      // 2. Calcular ingresos
      const pagosCobrados = pagos.filter((p) => p.estado === 'pagado');
      const pagosPendientes = pagos.filter((p) => p.estado === 'pendiente');
      const pagosVencidos = pagos.filter(
        (p) => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < ahora
      );

      const totalIngresos = pagosCobrados.reduce((sum, p) => sum + p.monto, 0);
      const totalPorCobrar = pagosPendientes.reduce((sum, p) => sum + p.monto, 0);
      const totalMorosos = pagosVencidos.reduce((sum, p) => sum + p.monto, 0);

      // 3. Obtener gastos del periodo
      let totalGastos = 0;
      let gastoMantenimiento = 0;
      let gastoServicios = 0;
      let gastoImpuestos = 0;
      let gastoSeguros = 0;
      let gastoAdministracion = 0;
      let gastoOtros = 0;

      try {
        const gastos = await prisma.expense.findMany({
          where: {
            companyId: session.user.companyId,
            fecha: {
              gte: inicio,
              lte: fin,
            },
          },
        });

        gastos.forEach((g: any) => {
          totalGastos += g.monto;
          switch (g.categoria?.toLowerCase()) {
            case 'mantenimiento':
            case 'reparaciones':
              gastoMantenimiento += g.monto;
              break;
            case 'servicios':
            case 'suministros':
              gastoServicios += g.monto;
              break;
            case 'impuestos':
            case 'ibi':
              gastoImpuestos += g.monto;
              break;
            case 'seguros':
              gastoSeguros += g.monto;
              break;
            case 'administracion':
            case 'gestion':
              gastoAdministracion += g.monto;
              break;
            default:
              gastoOtros += g.monto;
          }
        });
      } catch (gastoError) {
        console.warn('[Reportes Financieros] No se pudieron obtener gastos:', gastoError);
      }

      // 4. Obtener ocupación
      const units = await prisma.unit.findMany({
        where: {
          building: {
            companyId: session.user.companyId,
          },
        },
        select: {
          id: true,
          estado: true,
        },
      });

      const totalUnidades = units.length;
      const ocupadas = units.filter((u) => u.estado === 'ocupado' || u.estado === 'alquilado').length;
      const vacantes = totalUnidades - ocupadas;
      const porcentajeOcupacion = totalUnidades > 0 ? (ocupadas / totalUnidades) * 100 : 0;

      // 5. Flujos de caja mensuales
      const flujosCaja: Array<{ mes: string; ingresos: number; gastos: number; neto: number }> = [];
      const mesesCount = periodo === 'año' ? 12 : periodo === 'trimestre' ? 3 : 1;

      for (let i = 0; i < mesesCount; i++) {
        const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth() - (mesesCount - 1 - i), 1);
        const mesFin = new Date(ahora.getFullYear(), ahora.getMonth() - (mesesCount - 1 - i) + 1, 0);

        const ingresosMes = pagos
          .filter(
            (p) =>
              p.estado === 'pagado' &&
              p.fechaPago &&
              new Date(p.fechaPago) >= mesInicio &&
              new Date(p.fechaPago) <= mesFin
          )
          .reduce((sum, p) => sum + p.monto, 0);

        // Estimar gastos proporcionalmente si no tenemos datos detallados
        const gastosMes = totalGastos / mesesCount;

        flujosCaja.push({
          mes: mesInicio.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
          ingresos: Math.round(ingresosMes),
          gastos: Math.round(gastosMes),
          neto: Math.round(ingresosMes - gastosMes),
        });
      }

      // 6. Propiedades más rentables
      const ingresosPorPropiedad: Record<string, { nombre: string; ingresos: number; gastos: number }> = {};

      pagos.forEach((p) => {
        const buildingId = p.contract?.unit?.buildingId;
        const buildingName = p.contract?.unit?.building?.name || 'Sin nombre';
        if (buildingId) {
          if (!ingresosPorPropiedad[buildingId]) {
            ingresosPorPropiedad[buildingId] = { nombre: buildingName, ingresos: 0, gastos: 0 };
          }
          if (p.estado === 'pagado') {
            ingresosPorPropiedad[buildingId].ingresos += p.monto;
          }
        }
      });

      const propiedadesMasRentables = Object.entries(ingresosPorPropiedad)
        .map(([id, data]) => ({
          id,
          nombre: data.nombre,
          ingresos: Math.round(data.ingresos),
          gastos: Math.round(data.gastos),
          roi: data.gastos > 0 ? Math.round(((data.ingresos - data.gastos) / data.gastos) * 100) : 100,
        }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 5);

      // 7. Calcular métricas finales
      const beneficioNeto = totalIngresos - totalGastos;
      const margenOperativo = totalIngresos > 0 ? (beneficioNeto / totalIngresos) * 100 : 0;
      const porcentajeMorosidad = totalIngresos + totalPorCobrar > 0
        ? (totalMorosos / (totalIngresos + totalPorCobrar)) * 100
        : 0;

      resumen = {
        periodo: `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')}`,
        ingresos: {
          total: Math.round(totalIngresos),
          alquileres: Math.round(totalIngresos), // Por ahora todo es alquiler
          servicios: 0,
          otros: 0,
          porCobrar: Math.round(totalPorCobrar),
        },
        gastos: {
          total: Math.round(totalGastos),
          mantenimiento: Math.round(gastoMantenimiento),
          servicios: Math.round(gastoServicios),
          impuestos: Math.round(gastoImpuestos),
          seguros: Math.round(gastoSeguros),
          administracion: Math.round(gastoAdministracion),
          otros: Math.round(gastoOtros),
        },
        beneficioNeto: Math.round(beneficioNeto),
        margenOperativo: Math.round(margenOperativo * 10) / 10,
        ocupacion: {
          total: totalUnidades,
          ocupadas,
          vacantes,
          porcentaje: Math.round(porcentajeOcupacion * 10) / 10,
        },
        morosidad: {
          total: Math.round(totalMorosos),
          cantidad: pagosVencidos.length,
          porcentaje: Math.round(porcentajeMorosidad * 10) / 10,
        },
        flujosCaja,
        propiedadesMasRentables,
      };
    } catch (dbError: any) {
      console.error('[Reportes Financieros] Error BD:', dbError);

      // Retornar estructura vacía si hay error
      resumen = {
        periodo: `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')}`,
        ingresos: {
          total: 0,
          alquileres: 0,
          servicios: 0,
          otros: 0,
          porCobrar: 0,
        },
        gastos: {
          total: 0,
          mantenimiento: 0,
          servicios: 0,
          impuestos: 0,
          seguros: 0,
          administracion: 0,
          otros: 0,
        },
        beneficioNeto: 0,
        margenOperativo: 0,
        ocupacion: {
          total: 0,
          ocupadas: 0,
          vacantes: 0,
          porcentaje: 0,
        },
        morosidad: {
          total: 0,
          cantidad: 0,
          porcentaje: 0,
        },
        flujosCaja: [],
        propiedadesMasRentables: [],
      };
    }

    return NextResponse.json(resumen);
  } catch (error: any) {
    console.error('[Reportes Financieros] Error:', error);
    return NextResponse.json({ error: 'Error al generar reporte financiero' }, { status: 500 });
  }
}

// POST para generar reportes personalizados o exportar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, formato, filtros } = body;

    // Tipos de reportes disponibles
    const tiposReporte = {
      'resumen-mensual': 'Resumen financiero mensual',
      'flujo-caja': 'Flujo de caja detallado',
      'morosidad': 'Reporte de morosidad',
      'ocupacion': 'Reporte de ocupación',
      'rentabilidad': 'Análisis de rentabilidad',
      'comparativo': 'Comparativo periodos',
    };

    if (!tipo || !tiposReporte[tipo as keyof typeof tiposReporte]) {
      return NextResponse.json({
        error: 'Tipo de reporte inválido',
        tiposDisponibles: Object.keys(tiposReporte),
      }, { status: 400 });
    }

    // Generar datos según el tipo de reporte
    let datos: any = {};
    const ahora = new Date();
    const mesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const mesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

    switch (tipo) {
      case 'morosidad':
        try {
          const pagosMorosos = await prisma.payment.findMany({
            where: {
              contract: {
                unit: {
                  building: {
                    companyId: session.user.companyId,
                  },
                },
              },
              estado: 'pendiente',
              fechaVencimiento: {
                lt: ahora,
              },
            },
            include: {
              contract: {
                include: {
                  tenant: {
                    include: {
                      user: true,
                    },
                  },
                  unit: {
                    include: {
                      building: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              fechaVencimiento: 'asc',
            },
          });

          datos = {
            tipo: 'morosidad',
            generadoEn: ahora.toISOString(),
            totalMoroso: pagosMorosos.reduce((sum, p) => sum + p.monto, 0),
            cantidadMorosos: pagosMorosos.length,
            detalle: pagosMorosos.map((p) => ({
              id: p.id,
              inquilino: p.contract?.tenant?.user?.name || 'Sin nombre',
              propiedad: p.contract?.unit?.building?.name || 'Sin nombre',
              unidad: p.contract?.unit?.numero || 'N/A',
              monto: p.monto,
              fechaVencimiento: p.fechaVencimiento,
              diasMora: Math.floor(
                (ahora.getTime() - new Date(p.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)
              ),
            })),
          };
        } catch (err) {
          datos = { tipo: 'morosidad', detalle: [], error: 'No se pudieron obtener datos' };
        }
        break;

      case 'ocupacion':
        try {
          const unidades = await prisma.unit.findMany({
            where: {
              building: {
                companyId: session.user.companyId,
              },
            },
            include: {
              building: true,
              tenant: {
                include: {
                  user: true,
                },
              },
            },
          });

          const porEdificio: Record<string, { nombre: string; total: number; ocupadas: number }> = {};

          unidades.forEach((u) => {
            const bId = u.buildingId;
            const bName = u.building?.name || 'Sin nombre';
            if (!porEdificio[bId]) {
              porEdificio[bId] = { nombre: bName, total: 0, ocupadas: 0 };
            }
            porEdificio[bId].total++;
            if (u.estado === 'ocupado' || u.estado === 'alquilado' || u.tenantId) {
              porEdificio[bId].ocupadas++;
            }
          });

          const totalOcupadas = unidades.filter(
            (u) => u.estado === 'ocupado' || u.estado === 'alquilado' || u.tenantId
          ).length;

          datos = {
            tipo: 'ocupacion',
            generadoEn: ahora.toISOString(),
            totalUnidades: unidades.length,
            ocupadas: totalOcupadas,
            vacantes: unidades.length - totalOcupadas,
            porcentajeOcupacion:
              unidades.length > 0 ? Math.round((totalOcupadas / unidades.length) * 100) : 0,
            porEdificio: Object.entries(porEdificio).map(([id, data]) => ({
              id,
              ...data,
              porcentaje: data.total > 0 ? Math.round((data.ocupadas / data.total) * 100) : 0,
            })),
          };
        } catch (err) {
          datos = { tipo: 'ocupacion', porEdificio: [], error: 'No se pudieron obtener datos' };
        }
        break;

      default:
        datos = {
          tipo,
          mensaje: 'Reporte en desarrollo',
          generadoEn: ahora.toISOString(),
        };
    }

    return NextResponse.json({
      success: true,
      reporte: datos,
      formato: formato || 'json',
    });
  } catch (error: any) {
    console.error('[Reportes Financieros POST] Error:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
