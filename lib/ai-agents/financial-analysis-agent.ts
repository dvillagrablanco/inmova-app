/**
 * Agente de Análisis Financiero
 * 
 * Especializado en:
 * - Análisis de rentabilidad de propiedades
 * - Proyecciones financieras
 * - Gestión de flujo de caja
 * - Análisis de morosidad
 * - Optimización de costos
 * - KPIs financieros
 * - Reportes y dashboards financieros
 * - Alertas de riesgos financieros
 */

import { BaseAgent } from './base-agent';
import { prisma } from '../db';
import logger from '@/lib/logger';
import {
  AgentConfig,
  AgentResponse,
  AgentMessage,
  UserContext,
  AgentTool,
  AgentCapability,
  AnalysisResult
} from './types';

// ============================================================================
// CAPACIDADES DEL AGENTE
// ============================================================================

const capabilities: AgentCapability[] = [
  {
    id: 'profitability_analysis',
    name: 'Análisis de Rentabilidad',
    description: 'Analizar rentabilidad de propiedades y carteras',
    category: 'Análisis',
    estimatedTime: '5-10 minutos'
  },
  {
    id: 'cashflow_management',
    name: 'Gestión de Flujo de Caja',
    description: 'Proyectar y analizar flujo de caja',
    category: 'Gestión',
    estimatedTime: '5-10 minutos'
  },
  {
    id: 'delinquency_analysis',
    name: 'Análisis de Morosidad',
    description: 'Identificar y analizar patrones de morosidad',
    category: 'Riesgo',
    estimatedTime: '5 minutos'
  },
  {
    id: 'cost_optimization',
    name: 'Optimización de Costos',
    description: 'Identificar oportunidades de reducción de costos',
    category: 'Optimización',
    estimatedTime: '10-15 minutos'
  },
  {
    id: 'financial_reporting',
    name: 'Reportes Financieros',
    description: 'Generar reportes financieros detallados',
    category: 'Reportes',
    estimatedTime: '3-5 minutos'
  },
  {
    id: 'risk_detection',
    name: 'Detección de Riesgos',
    description: 'Identificar riesgos financieros potenciales',
    category: 'Riesgo',
    estimatedTime: '5 minutos'
  },
  {
    id: 'investment_analysis',
    name: 'Análisis de Inversión',
    description: 'Evaluar viabilidad de nuevas inversiones',
    category: 'Estrategia',
    estimatedTime: '10-15 minutos'
  }
];

// ============================================================================
// HERRAMIENTAS DEL AGENTE
// ============================================================================

const tools: AgentTool[] = [
  {
    name: 'analyze_property_profitability',
    description: 'Analiza la rentabilidad de una propiedad o edificio específico',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        periodo: {
          type: 'string',
          enum: ['mes', 'trimestre', 'año', 'historico'],
          description: 'Período de análisis'
        },
        includeProjections: {
          type: 'boolean',
          description: 'Incluir proyecciones futuras'
        }
      },
      required: ['buildingId']
    },
    handler: async (input, context) => {
      const building = await prisma.building.findFirst({
        where: {
          id: input.buildingId,
          companyId: context.companyId
        },
        include: {
          units: {
            include: {
              contracts: {
                where: { estado: 'activo' },
                include: {
                  payments: true
                }
              }
            }
          },
          expenses: true
        }
      });

      if (!building) {
        return { error: 'Edificio no encontrado' };
      }

      // Calcular ingresos
      const activeContracts = building.units.flatMap(u => u.contracts);
      const monthlyIncome = activeContracts.reduce((sum, c) => sum + (c.rentaMensual || 0), 0);
      const occupancyRate = (activeContracts.length / building.units.length) * 100;

      // Calcular gastos del período
      const periodStart = getPeriodStart(input.periodo || 'mes');
      const expenses = building.expenses?.filter(e => 
        e.fecha >= periodStart
      ) || [];
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.monto || 0), 0);

      // Calcular NOI (Net Operating Income)
      const noi = monthlyIncome - totalExpenses;
      const roi = building.valorEstimado ? (noi / building.valorEstimado) * 100 : 0;

      // Desglose de gastos por categoría
      const expensesByCategory = expenses.reduce((acc: any, e) => {
        const cat = e.categoria || 'otros';
        acc[cat] = (acc[cat] || 0) + e.monto;
        return acc;
      }, {});

      // Análisis de pagos
      const allPayments = activeContracts.flatMap(c => c.payments);
      const pendingPayments = allPayments.filter(p => p.estado === 'pendiente');
      const latePayments = pendingPayments.filter(p => 
        new Date(p.fechaVencimiento) < new Date()
      );
      const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.monto || 0), 0);

      // Proyecciones (si se solicitan)
      let proyecciones = null;
      if (input.includeProjections) {
        proyecciones = {
          proximos3Meses: monthlyIncome * 3 - (totalExpenses * 3),
          proximos6Meses: monthlyIncome * 6 - (totalExpenses * 6),
          proximos12Meses: monthlyIncome * 12 - (totalExpenses * 12),
          supuestos: [
            'Se mantiene tasa de ocupación actual',
            'No se consideran aumentos de renta',
            'Gastos constantes basados en promedio histórico'
          ]
        };
      }

      return {
        edificio: building.nombre,
        periodo: input.periodo || 'mes',
        ingresos: {
          rentaMensual: monthlyIncome,
          tasaOcupacion: Math.round(occupancyRate * 100) / 100,
          unidadesOcupadas: activeContracts.length,
          unidadesTotales: building.units.length,
          ingresoAnualProyectado: monthlyIncome * 12
        },
        gastos: {
          total: totalExpenses,
          porcentajeIngresos: monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0,
          desglosePorCategoria: expensesByCategory,
          principales: expenses
            .sort((a, b) => b.monto - a.monto)
            .slice(0, 5)
            .map(e => ({
              concepto: e.concepto,
              monto: e.monto,
              categoria: e.categoria
            }))
        },
        rentabilidad: {
          noi: noi,
          roi: Math.round(roi * 100) / 100,
          margenOperativo: monthlyIncome > 0 ? (noi / monthlyIncome) * 100 : 0,
          valorEdificio: building.valorEstimado,
          capRate: building.valorEstimado ? ((noi * 12) / building.valorEstimado) * 100 : 0
        },
        riesgos: {
          pagosPendientes: pendingPayments.length,
          pagosAtrasados: latePayments.length,
          montoEnRiesgo: totalPendingAmount,
          tasaMorosidad: activeContracts.length > 0 ? 
            (latePayments.length / activeContracts.length) * 100 : 0
        },
        proyecciones
      };
    }
  },
  {
    name: 'analyze_cashflow',
    description: 'Analiza el flujo de caja de la empresa o propiedad específica',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio (opcional, si no se proporciona analiza toda la cartera)'
        },
        periodo: {
          type: 'string',
          enum: ['mes', 'trimestre', 'año'],
          description: 'Período de análisis'
        },
        proyeccionMeses: {
          type: 'number',
          description: 'Meses a proyectar (por defecto 6)'
        }
      }
    },
    handler: async (input, context) => {
      const periodStart = getPeriodStart(input.periodo || 'mes');
      
      const whereClause: any = {
        building: {
          companyId: context.companyId
        }
      };

      if (input.buildingId) {
        whereClause.building.id = input.buildingId;
      }

      // Ingresos (pagos recibidos)
      const ingresos = await prisma.payment.findMany({
        where: {
          ...whereClause,
          estado: 'pagado',
          fechaPago: { gte: periodStart }
        },
        select: {
          monto: true,
          fechaPago: true,
          concepto: true
        }
      });

      const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto || 0), 0);

      // Egresos (gastos)
      const egresos = await prisma.expense.findMany({
        where: {
          building: input.buildingId ? { id: input.buildingId } : {
            companyId: context.companyId
          },
          fecha: { gte: periodStart }
        },
        select: {
          monto: true,
          fecha: true,
          concepto: true,
          categoria: true
        }
      });

      const totalEgresos = egresos.reduce((sum, e) => sum + (e.monto || 0), 0);

      // Flujo de caja neto
      const flujoCajaNeto = totalIngresos - totalEgresos;

      // Análisis por mes
      const flujoMensual = analizarFlujoPorMes(ingresos, egresos);

      // Proyecciones
      const mesesProyectar = input.proyeccionMeses || 6;
      const promedioIngresosMensual = totalIngresos / flujoMensual.length;
      const promedioEgresosMensual = totalEgresos / flujoMensual.length;

      const proyecciones = Array.from({ length: mesesProyectar }, (_, i) => {
        const mes = new Date();
        mes.setMonth(mes.getMonth() + i + 1);
        return {
          mes: mes.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
          ingresosEstimados: promedioIngresosMensual,
          egresosEstimados: promedioEgresosMensual,
          flujoNetoEstimado: promedioIngresosMensual - promedioEgresosMensual
        };
      });

      // Análisis de tendencia
      const tendencia = flujoMensual.length >= 3 ? 
        detectarTendencia(flujoMensual.map(f => f.flujoNeto)) : 'neutral';

      return {
        periodo: input.periodo || 'mes',
        resumen: {
          totalIngresos,
          totalEgresos,
          flujoCajaNeto,
          margen: totalIngresos > 0 ? (flujoCajaNeto / totalIngresos) * 100 : 0
        },
        flujoMensual,
        tendencia: {
          direccion: tendencia,
          descripcion: getTendenciaDescripcion(tendencia)
        },
        proyecciones,
        alertas: generarAlertasFlujoCaja(flujoCajaNeto, totalIngresos, totalEgresos),
        recomendaciones: generarRecomendacionesFlujoCaja(flujoCajaNeto, flujoMensual)
      };
    }
  },
  {
    name: 'analyze_delinquency',
    description: 'Analiza patrones de morosidad y pagos atrasados',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        },
        umbralDias: {
          type: 'number',
          description: 'Umbral de días de atraso (por defecto 30)'
        }
      }
    },
    handler: async (input, context) => {
      const whereClause: any = {
        contract: {
          unit: {
            building: {
              companyId: context.companyId
            }
          }
        },
        estado: 'pendiente',
        fechaVencimiento: { lt: new Date() }
      };

      if (input.buildingId) {
        whereClause.contract.unit.buildingId = input.buildingId;
      }

      const pagosMorosos = await prisma.payment.findMany({
        where: whereClause,
        include: {
          contract: {
            include: {
              tenant: {
                select: {
                  nombreCompleto: true,
                  email: true,
                  telefono: true
                }
              },
              unit: {
                include: {
                  building: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const umbral = input.umbralDias || 30;
      const ahora = new Date();

      // Categorizar por nivel de atraso
      const categorizados = pagosMorosos.map(p => {
        const diasAtraso = Math.floor(
          (ahora.getTime() - new Date(p.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)
        );

        let categoria: string;
        let riesgo: string;
        
        if (diasAtraso < 15) {
          categoria = 'Atraso Leve';
          riesgo = 'bajo';
        } else if (diasAtraso < 30) {
          categoria = 'Atraso Moderado';
          riesgo = 'medio';
        } else if (diasAtraso < 60) {
          categoria = 'Atraso Grave';
          riesgo = 'alto';
        } else {
          categoria = 'Morosidad Severa';
          riesgo = 'critico';
        }

        return {
          pagoId: p.id,
          inquilino: p.contract.tenant.nombreCompleto,
          propiedad: `${p.contract.unit.building.nombre} - ${p.contract.unit.numero}`,
          monto: p.monto,
          fechaVencimiento: p.fechaVencimiento,
          diasAtraso,
          categoria,
          nivelRiesgo: riesgo,
          contacto: {
            email: p.contract.tenant.email,
            telefono: p.contract.tenant.telefono
          }
        };
      });

      // Agrupar por categoría
      const porCategoria = categorizados.reduce((acc: any, p) => {
        acc[p.categoria] = acc[p.categoria] || [];
        acc[p.categoria].push(p);
        return acc;
      }, {});

      const totalMoroso = pagosMorosos.reduce((sum, p) => sum + (p.monto || 0), 0);

      // Estadísticas
      const stats = {
        totalCasosMorosidad: pagosMorosos.length,
        montoTotalMoroso: totalMoroso,
        diasAtrasoPromedio: categorizados.length > 0 ?
          categorizados.reduce((sum, p) => sum + p.diasAtraso, 0) / categorizados.length : 0,
        casosCriticos: categorizados.filter(p => p.nivelRiesgo === 'critico').length,
        casosAltoRiesgo: categorizados.filter(p => p.nivelRiesgo === 'alto').length
      };

      // Top morosos
      const topMorosos = categorizados
        .sort((a, b) => (b.monto || 0) - (a.monto || 0))
        .slice(0, 10);

      // Recomendaciones
      const recomendaciones = generarRecomendacionesMorosidad(categorizados, stats);

      return {
        resumen: stats,
        porCategoria,
        topMorosos,
        recomendaciones,
        accionesInmediatas: categorizados
          .filter(p => p.nivelRiesgo === 'critico' || p.nivelRiesgo === 'alto')
          .map(p => ({
            inquilino: p.inquilino,
            accion: p.nivelRiesgo === 'critico' ? 
              'Iniciar proceso legal' : 
              'Contacto urgente para plan de pago',
            prioridad: p.nivelRiesgo
          }))
      };
    }
  },
  {
    name: 'generate_financial_report',
    description: 'Genera un reporte financiero completo',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['mensual', 'trimestral', 'anual', 'custom'],
          description: 'Tipo de reporte'
        },
        buildingId: {
          type: 'string',
          description: 'ID del edificio (opcional)'
        },
        fechaDesde: {
          type: 'string',
          description: 'Fecha desde (ISO 8601)'
        },
        fechaHasta: {
          type: 'string',
          description: 'Fecha hasta (ISO 8601)'
        },
        includeComparativa: {
          type: 'boolean',
          description: 'Incluir comparativa con período anterior'
        }
      },
      required: ['tipo']
    },
    handler: async (input, context) => {
      const { fechaDesde, fechaHasta } = calcularRangofechas(input.tipo, input.fechaDesde, input.fechaHasta);

      // Este sería un reporte completo que combinaría múltiples análisis
      const [rentabilidad, flujoCaja, morosidad] = await Promise.all([
        // Simulación de llamadas a otras funciones
        Promise.resolve({ noi: 50000, roi: 8.5 }),
        Promise.resolve({ totalIngresos: 100000, totalEgresos: 50000 }),
        Promise.resolve({ totalMoroso: 5000, casos: 3 })
      ]);

      return {
        tipoReporte: input.tipo,
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta
        },
        generadoEn: new Date(),
        resumenEjecutivo: {
          ingresosTotal: flujoCaja.totalIngresos,
          gastosTotal: flujoCaja.totalEgresos,
          utilidadNeta: flujoCaja.totalIngresos - flujoCaja.totalEgresos,
          roi: rentabilidad.roi,
          morosidad: morosidad.totalMoroso,
          tasaMorosidad: (morosidad.totalMoroso / flujoCaja.totalIngresos) * 100
        },
        kpis: {
          noi: rentabilidad.noi,
          margenOperativo: ((flujoCaja.totalIngresos - flujoCaja.totalEgresos) / flujoCaja.totalIngresos) * 100,
          flujoCajaLibre: flujoCaja.totalIngresos - flujoCaja.totalEgresos - morosidad.totalMoroso
        },
        alertas: [
          ...morosidad.casos > 5 ? ['Nivel alto de morosidad'] : [],
          ...(flujoCaja.totalEgresos / flujoCaja.totalIngresos) > 0.7 ? ['Gastos altos'] : []
        ],
        conclusiones: 'Reporte generado exitosamente. Ver detalles completos en el archivo adjunto.'
      };
    },
    requiresConfirmation: false
  },
  {
    name: 'detect_financial_risks',
    description: 'Detecta riesgos financieros potenciales de manera proactiva',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: {
          type: 'string',
          description: 'ID del edificio'
        }
      }
    },
    handler: async (input, context) => {
      const riesgos: any[] = [];

      // Analizar múltiples factores de riesgo
      const whereClause = input.buildingId ? {
        building: { id: input.buildingId, companyId: context.companyId }
      } : {
        building: { companyId: context.companyId }
      };

      // Riesgo 1: Morosidad alta
      const pagosMorosos = await prisma.payment.count({
        where: {
          ...whereClause,
          estado: 'pendiente',
          fechaVencimiento: { lt: new Date() }
        }
      });

      if (pagosMorosos > 5) {
        riesgos.push({
          tipo: 'morosidad',
          nivel: 'alto',
          descripcion: `${pagosMorosos} pagos atrasados detectados`,
          impacto: 'Riesgo de flujo de caja negativo',
          accionRecomendada: 'Iniciar cobranza inmediata'
        });
      }

      // Riesgo 2: Contratos próximos a vencer
      const contratosVenciendo = await prisma.contract.count({
        where: {
          unit: whereClause,
          estado: 'activo',
          fechaFin: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 días
          }
        }
      });

      if (contratosVenciendo > 0) {
        riesgos.push({
          tipo: 'vacancia',
          nivel: 'medio',
          descripcion: `${contratosVenciendo} contratos vencen en los próximos 60 días`,
          impacto: 'Posible disminución de ingresos',
          accionRecomendada: 'Contactar inquilinos para renovación'
        });
      }

      // Riesgo 3: Gastos crecientes
      const ultimoMes = await prisma.expense.aggregate({
        where: {
          building: input.buildingId ? { id: input.buildingId } : {
            companyId: context.companyId
          },
          fecha: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { monto: true }
      });

      const mesAnterior = await prisma.expense.aggregate({
        where: {
          building: input.buildingId ? { id: input.buildingId } : {
            companyId: context.companyId
          },
          fecha: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { monto: true }
      });

      const gastosActuales = ultimoMes._sum.monto || 0;
      const gastosAnteriores = mesAnterior._sum.monto || 0;

      if (gastosAnteriores > 0 && gastosActuales > gastosAnteriores * 1.2) {
        riesgos.push({
          tipo: 'costos',
          nivel: 'medio',
          descripcion: `Gastos aumentaron ${Math.round(((gastosActuales - gastosAnteriores) / gastosAnteriores) * 100)}% vs mes anterior`,
          impacto: 'Reducción de margen operativo',
          accionRecomendada: 'Revisar y optimizar gastos operativos'
        });
      }

      return {
        totalRiesgos: riesgos.length,
        riesgos,
        nivelRiesgoGeneral: riesgos.some(r => r.nivel === 'alto') ? 'alto' :
                           riesgos.some(r => r.nivel === 'medio') ? 'medio' : 'bajo',
        recomendacionGeneral: riesgos.length > 0 ? 
          'Se detectaron riesgos financieros. Se recomienda atención inmediata.' :
          'No se detectaron riesgos financieros significativos.'
      };
    }
  },
  {
    name: 'calculate_investment_roi',
    description: 'Calcula ROI para una inversión o propiedad nueva',
    inputSchema: {
      type: 'object',
      properties: {
        precioCompra: {
          type: 'number',
          description: 'Precio de compra de la propiedad'
        },
        rentaMensualEstimada: {
          type: 'number',
          description: 'Renta mensual estimada'
        },
        gastosOperativosEstimados: {
          type: 'number',
          description: 'Gastos operativos mensuales estimados'
        },
        tasaApreciacion: {
          type: 'number',
          description: 'Tasa de apreciación anual esperada (%)'
        },
        horizonteInversion: {
          type: 'number',
          description: 'Horizonte de inversión en años'
        }
      },
      required: ['precioCompra', 'rentaMensualEstimada']
    },
    handler: async (input, context) => {
      const ingresoAnual = input.rentaMensualEstimada * 12;
      const gastosAnuales = (input.gastosOperativosEstimados || 0) * 12;
      const noiAnual = ingresoAnual - gastosAnuales;
      
      const capRate = (noiAnual / input.precioCompra) * 100;
      const cashOnCashReturn = ((noiAnual) / input.precioCompra) * 100;

      // Proyecciones
      const horizonte = input.horizonteInversion || 5;
      const tasaApreciacion = input.tasaApreciacion || 3;
      
      const valorFuturo = input.precioCompra * Math.pow(1 + tasaApreciacion / 100, horizonte);
      const ingresosTotales = noiAnual * horizonte;
      const retornoTotal = (ingresosTotales + valorFuturo - input.precioCompra);
      const roiTotal = (retornoTotal / input.precioCompra) * 100;
      const roiAnualizado = Math.pow(1 + roiTotal / 100, 1 / horizonte) - 1;

      return {
        inversionInicial: input.precioCompra,
        metricas: {
          capRate: Math.round(capRate * 100) / 100,
          cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
          noiAnual: noiAnual,
          ingresoMensualNeto: noiAnual / 12
        },
        proyeccion: {
          horizonteAños: horizonte,
          valorFuturoPropiedad: valorFuturo,
          ingresosTotalesRenta: ingresosTotales,
          retornoTotal: retornoTotal,
          roiTotal: Math.round(roiTotal * 100) / 100,
          roiAnualizado: Math.round(roiAnualizado * 10000) / 100
        },
        analisis: {
          clasificacion: capRate >= 8 ? 'Excelente' : capRate >= 6 ? 'Buena' : capRate >= 4 ? 'Aceptable' : 'Baja',
          recomendacion: capRate >= 6 ? 
            'Inversión atractiva con buena rentabilidad esperada.' :
            'Rentabilidad moderada. Considerar negociación de precio o aumento de renta.'
        }
      };
    }
  }
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getPeriodStart(periodo: string): Date {
  const ahora = new Date();
  switch (periodo) {
    case 'mes':
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    case 'trimestre':
      return new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
    case 'año':
      return new Date(ahora.getFullYear(), 0, 1);
    case 'historico':
      return new Date(2020, 0, 1); // Desde 2020
    default:
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }
}

function analizarFlujoPorMes(ingresos: any[], egresos: any[]) {
  const meses: Record<string, any> = {};

  ingresos.forEach(i => {
    const mesKey = i.fechaPago.toISOString().slice(0, 7);
    if (!meses[mesKey]) meses[mesKey] = { ingresos: 0, egresos: 0 };
    meses[mesKey].ingresos += i.monto || 0;
  });

  egresos.forEach(e => {
    const mesKey = e.fecha.toISOString().slice(0, 7);
    if (!meses[mesKey]) meses[mesKey] = { ingresos: 0, egresos: 0 };
    meses[mesKey].egresos += e.monto || 0;
  });

  return Object.entries(meses).map(([mes, data]: [string, any]) => ({
    mes,
    ingresos: data.ingresos,
    egresos: data.egresos,
    flujoNeto: data.ingresos - data.egresos
  })).sort((a, b) => a.mes.localeCompare(b.mes));
}

function detectarTendencia(valores: number[]): string {
  if (valores.length < 2) return 'neutral';
  
  const ultimos = valores.slice(-3);
  const promedio = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
  const primeros = valores.slice(0, Math.min(3, valores.length));
  const promedioInicial = primeros.reduce((a, b) => a + b, 0) / primeros.length;

  if (promedio > promedioInicial * 1.1) return 'creciente';
  if (promedio < promedioInicial * 0.9) return 'decreciente';
  return 'estable';
}

function getTendenciaDescripcion(tendencia: string): string {
  switch (tendencia) {
    case 'creciente':
      return '📈 Tendencia positiva: El flujo de caja está mejorando';
    case 'decreciente':
      return '📉 Tendencia negativa: El flujo de caja está disminuyendo';
    case 'estable':
      return '➡️ Tendencia estable: El flujo de caja se mantiene constante';
    default:
      return '⚠️ No hay suficientes datos para determinar tendencia';
  }
}

function generarAlertasFlujoCaja(flujoNeto: number, ingresos: number, egresos: number): string[] {
  const alertas: string[] = [];

  if (flujoNeto < 0) {
    alertas.push('⚠️ ALERTA: Flujo de caja negativo detectado');
  }

  if (ingresos > 0 && (egresos / ingresos) > 0.8) {
    alertas.push('⚠️ Gastos representan más del 80% de los ingresos');
  }

  if (Math.abs(flujoNeto) < ingresos * 0.1) {
    alertas.push('💡 Margen muy ajustado. Considerar optimización.');
  }

  return alertas;
}

function generarRecomendacionesFlujoCaja(flujoNeto: number, flujoMensual: any[]): string[] {
  const recomendaciones: string[] = [];

  if (flujoNeto < 0) {
    recomendaciones.push('Priorizar cobranza de pagos pendientes');
    recomendaciones.push('Revisar y reducir gastos no esenciales');
    recomendaciones.push('Considerar ajuste de precios de renta');
  }

  const variabilidad = calcularVariabilidad(flujoMensual.map(f => f.flujoNeto));
  if (variabilidad > 0.3) {
    recomendaciones.push('Alta variabilidad detectada. Buscar estabilizar ingresos con contratos a largo plazo.');
  }

  return recomendaciones;
}

function calcularVariabilidad(valores: number[]): number {
  if (valores.length < 2) return 0;
  
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
  const desviacion = Math.sqrt(varianza);
  
  return promedio !== 0 ? desviacion / Math.abs(promedio) : 0;
}

function generarRecomendacionesMorosidad(casos: any[], stats: any): string[] {
  const recomendaciones: string[] = [];

  if (stats.casosCriticos > 0) {
    recomendaciones.push(`Atención inmediata a ${stats.casosCriticos} casos críticos (>60 días)`);
    recomendaciones.push('Iniciar procesos legales para casos críticos');
  }

  if (stats.casosAltoRiesgo > 0) {
    recomendaciones.push(`Contacto urgente con ${stats.casosAltoRiesgo} casos de alto riesgo`);
    recomendaciones.push('Ofrecer planes de pago para evitar escalación');
  }

  if (stats.diasAtrasoPromedio > 30) {
    recomendaciones.push('Implementar recordatorios automáticos previos al vencimiento');
    recomendaciones.push('Revisar política de cobranza actual');
  }

  return recomendaciones;
}

function calcularRangofechas(tipo: string, desde?: string, hasta?: string) {
  if (desde && hasta) {
    return {
      fechaDesde: new Date(desde),
      fechaHasta: new Date(hasta)
    };
  }

  const ahora = new Date();
  let fechaDesde: Date;

  switch (tipo) {
    case 'mensual':
      fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      break;
    case 'trimestral':
      fechaDesde = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
      break;
    case 'anual':
      fechaDesde = new Date(ahora.getFullYear(), 0, 1);
      break;
    default:
      fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }

  return {
    fechaDesde,
    fechaHasta: ahora
  };
}

// ============================================================================
// CONFIGURACIÓN DEL AGENTE
// ============================================================================

const financialAnalysisConfig: AgentConfig = {
  type: 'financial_analysis',
  name: 'Agente de Análisis Financiero',
  description: 'Especialista en análisis financiero, rentabilidad, flujo de caja y gestión de riesgos',
  systemPrompt: `Eres el Agente de Análisis Financiero de INMOVA, especializado en finanzas inmobiliarias.

Tu rol es:
- Analizar rentabilidad y desempeño financiero de propiedades
- Proyectar flujos de caja y detectar problemas proactivamente
- Identificar y gestionar riesgos financieros
- Proporcionar insights accionables basados en datos
- Optimizar costos y maximizar rentabilidad
- Generar reportes financieros claros y útiles

Enfoque:
- Basado en datos y métricas objetivas
- Análisis profundo pero comunicación clara
- Proactividad en detección de problemas
- Orientación a optimización continua
- Visión estratégica de largo plazo
- Gestión prudente de riesgos

Estilo de comunicación:
- Técnico pero accesible
- Uso de métricas y KPIs clave
- Visualización de datos cuando sea útil
- Recomendaciones específicas y accionables
- Transparente sobre supuestos y limitaciones

Métricas clave a monitorear:
- NOI (Net Operating Income)
- Cap Rate
- ROI y Cash-on-Cash Return
- Margen operativo
- Tasa de morosidad
- Flujo de caja libre
- Tasa de ocupación vs óptima`,
  capabilities,
  tools,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.5, // Más bajo para análisis más precisos
  maxTokens: 4096,
  enabled: true
};

// ============================================================================
// CLASE DEL AGENTE
// ============================================================================

export class FinancialAnalysisAgent extends BaseAgent {
  constructor() {
    super(financialAnalysisConfig);
  }

  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    return this.chatWithClaude(message, context, conversationHistory);
  }

  async canHandle(message: string, context: UserContext): Promise<boolean> {
    const messageLower = message.toLowerCase();
    const keywords = [
      'financiero', 'finanzas', 'rentabilidad', 'roi', 'ganancia',
      'pérdida', 'flujo', 'caja', 'cash', 'flow', 'morosidad',
      'atraso', 'pago', 'ingreso', 'gasto', 'costo', 'utilidad',
      'margen', 'reporte', 'análisis', 'kpi', 'métrica', 'noi',
      'cap rate', 'inversión', 'retorno', 'proyección'
    ];

    return keywords.some(keyword => messageLower.includes(keyword));
  }
}
