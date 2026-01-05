/**
 * Servicio de Analytics Dashboard para eWoorker
 *
 * Proporciona métricas detalladas y KPIs para empresas y administradores.
 *
 * @module EwoorkerAnalyticsService
 */

import { prisma } from './db';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PerfilMetrics {
  // Obras
  obrasPublicadas: number;
  obrasPendientes: number;
  obrasEnProgreso: number;
  obrasCompletadas: number;

  // Ofertas
  ofertasEnviadas: number;
  ofertasRecibidas: number;
  ofertasAceptadas: number;
  tasaExitoOfertas: number;

  // Contratos
  contratosActivos: number;
  contratosCompletados: number;
  valorTotalContratos: number;

  // Financiero
  ingresosTotales: number;
  pagosPendientes: number;
  pagosCompletados: number;

  // Social
  rating: number;
  totalReviews: number;
  responseTimeAvg: number; // minutos

  // Engagement
  loginStreak: number;
  mensajesEnviados: number;
  tiempoEnPlataforma: number; // minutos

  // Gamificación
  puntos: number;
  nivel: number;
  logrosDesbloqueados: number;

  // Referidos
  referidosEnviados: number;
  referidosVerificados: number;
}

export interface PlatformMetrics {
  // Usuarios
  totalEmpresas: number;
  empresasActivas: number;
  empresasVerificadas: number;
  nuevasEmpresasHoy: number;
  nuevasEmpresasSemana: number;
  nuevasEmpresasMes: number;

  // Obras
  totalObras: number;
  obrasActivas: number;
  obrasCompletadas: number;
  valorTotalObras: number;

  // Ofertas
  totalOfertas: number;
  ofertasHoy: number;
  tasaConversion: number;

  // Contratos
  totalContratos: number;
  contratosActivos: number;
  valorMedioContrato: number;

  // Financiero
  volumenTransacciones: number;
  comisionesGeneradas: number;
  ingresosSocio: number;
  ingresosPlataforma: number;

  // Engagement
  usuariosActivosDiarios: number;
  usuariosActivosSemanales: number;
  usuariosActivosMensuales: number;
  mensajesTotales: number;

  // Documentos
  documentosPendientes: number;
  documentosProximosVencer: number;
  documentosVencidos: number;
}

export interface TrendData {
  date: string;
  value: number;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerAnalyticsService {
  /**
   * Obtiene métricas de un perfil de empresa
   */
  async getPerfilMetrics(
    perfilEmpresaId: string,
    timeRange?: TimeRange
  ): Promise<PerfilMetrics | null> {
    try {
      const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
        where: { id: perfilEmpresaId },
        include: {
          company: true,
        },
      });

      if (!perfil) return null;

      const dateFilter = timeRange
        ? { createdAt: { gte: timeRange.start, lte: timeRange.end } }
        : {};

      // Obras
      const obras = await prisma.ewoorkerObra.groupBy({
        by: ['estado'],
        where: { empresaId: perfilEmpresaId, ...dateFilter },
        _count: { id: true },
      });

      const obrasMap = new Map(obras.map((o) => [o.estado, o._count.id]));

      // Ofertas enviadas
      const ofertasEnviadas = await prisma.ewoorkerOferta.count({
        where: { empresaId: perfilEmpresaId, ...dateFilter },
      });

      const ofertasAceptadasEnviadas = await prisma.ewoorkerOferta.count({
        where: { empresaId: perfilEmpresaId, estado: 'aceptada', ...dateFilter },
      });

      // Ofertas recibidas (en mis obras)
      const ofertasRecibidas = await prisma.ewoorkerOferta.count({
        where: {
          obra: { empresaId: perfilEmpresaId },
          ...dateFilter,
        },
      });

      // Contratos
      const contratos = await prisma.ewoorkerContrato.groupBy({
        by: ['estado'],
        where: {
          OR: [{ empresaContratanteId: perfilEmpresaId }, { empresaContratadaId: perfilEmpresaId }],
          ...dateFilter,
        },
        _count: { id: true },
        _sum: { montoTotal: true },
      });

      const contratosActivos = contratos.find((c) => c.estado === 'activo')?._count.id || 0;
      const contratosCompletados = contratos.find((c) => c.estado === 'completado')?._count.id || 0;
      const valorTotalContratos = contratos.reduce((sum, c) => sum + (c._sum.montoTotal || 0), 0);

      // Transacciones
      const transacciones = await prisma.ewoorkerTransaccion.aggregate({
        where: {
          perfilEmpresaId,
          estado: 'completado',
          ...dateFilter,
        },
        _sum: { monto: true },
      });

      const pagosPendientes = await prisma.ewoorkerTransaccion.aggregate({
        where: {
          perfilEmpresaId,
          estado: { in: ['pendiente', 'en_proceso'] },
        },
        _sum: { monto: true },
      });

      // Chat
      const mensajesEnviados = await prisma.ewoorkerMensajeChat.count({
        where: {
          remitente: { perfilEmpresaId },
          ...dateFilter,
        },
      });

      // Referidos
      const referidosEnviados = await prisma.ewoorkerReferral.count({
        where: { referrerEmpresaId: perfilEmpresaId },
      });

      const referidosVerificados = await prisma.ewoorkerReferral.count({
        where: { referrerEmpresaId: perfilEmpresaId, status: 'verified' },
      });

      return {
        obrasPublicadas:
          (obrasMap.get('abierta') || 0) +
          (obrasMap.get('en_progreso') || 0) +
          (obrasMap.get('completada') || 0),
        obrasPendientes: obrasMap.get('abierta') || 0,
        obrasEnProgreso: obrasMap.get('en_progreso') || 0,
        obrasCompletadas: obrasMap.get('completada') || 0,

        ofertasEnviadas,
        ofertasRecibidas,
        ofertasAceptadas: ofertasAceptadasEnviadas,
        tasaExitoOfertas:
          ofertasEnviadas > 0 ? Math.round((ofertasAceptadasEnviadas / ofertasEnviadas) * 100) : 0,

        contratosActivos,
        contratosCompletados,
        valorTotalContratos,

        ingresosTotales: transacciones._sum.monto || 0,
        pagosPendientes: pagosPendientes._sum.monto || 0,
        pagosCompletados: transacciones._sum.monto || 0,

        rating: perfil.rating || 0,
        totalReviews: 0, // TODO: Implementar sistema de reviews
        responseTimeAvg: 30, // TODO: Calcular tiempo medio de respuesta

        loginStreak: perfil.loginStreak || 0,
        mensajesEnviados,
        tiempoEnPlataforma: 0, // TODO: Tracking de tiempo

        puntos: perfil.gamificationPoints || 0,
        nivel: perfil.gamificationLevel || 1,
        logrosDesbloqueados: ((perfil.gamificationAchievements as string[]) || []).length,

        referidosEnviados,
        referidosVerificados,
      };
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error obteniendo métricas de perfil:', error);
      return null;
    }
  }

  /**
   * Obtiene métricas de la plataforma (admin)
   */
  async getPlatformMetrics(timeRange?: TimeRange): Promise<PlatformMetrics> {
    try {
      const dateFilter = timeRange
        ? { createdAt: { gte: timeRange.start, lte: timeRange.end } }
        : {};

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);

      // Empresas
      const [totalEmpresas, empresasActivas, empresasVerificadas] = await Promise.all([
        prisma.ewoorkerPerfilEmpresa.count(),
        prisma.ewoorkerPerfilEmpresa.count({ where: { activo: true } }),
        prisma.ewoorkerPerfilEmpresa.count({ where: { verificado: true } }),
      ]);

      const [nuevasHoy, nuevasSemana, nuevasMes] = await Promise.all([
        prisma.ewoorkerPerfilEmpresa.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.ewoorkerPerfilEmpresa.count({
          where: { createdAt: { gte: startOfWeek } },
        }),
        prisma.ewoorkerPerfilEmpresa.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

      // Obras
      const obrasStats = await prisma.ewoorkerObra.aggregate({
        _count: { id: true },
        _sum: { presupuestoMaximo: true },
        where: dateFilter,
      });

      const obrasActivas = await prisma.ewoorkerObra.count({
        where: { estado: { in: ['abierta', 'en_progreso'] } },
      });

      const obrasCompletadas = await prisma.ewoorkerObra.count({
        where: { estado: 'completada', ...dateFilter },
      });

      // Ofertas
      const ofertasStats = await Promise.all([
        prisma.ewoorkerOferta.count({ where: dateFilter }),
        prisma.ewoorkerOferta.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.ewoorkerOferta.count({ where: { estado: 'aceptada', ...dateFilter } }),
      ]);

      // Contratos
      const contratosStats = await prisma.ewoorkerContrato.aggregate({
        _count: { id: true },
        _avg: { montoTotal: true },
        where: dateFilter,
      });

      const contratosActivos = await prisma.ewoorkerContrato.count({
        where: { estado: 'activo' },
      });

      // Transacciones
      const transacciones = await prisma.ewoorkerTransaccion.aggregate({
        where: { estado: 'completado', ...dateFilter },
        _sum: { monto: true, beneficioSocio: true, beneficioPlataforma: true },
      });

      // Engagement
      const [activosDiarios, activosSemanales, activosMensuales] = await Promise.all([
        prisma.ewoorkerPerfilEmpresa.count({
          where: { lastLoginDate: { gte: startOfToday } },
        }),
        prisma.ewoorkerPerfilEmpresa.count({
          where: { lastLoginDate: { gte: startOfWeek } },
        }),
        prisma.ewoorkerPerfilEmpresa.count({
          where: { lastLoginDate: { gte: startOfMonth } },
        }),
      ]);

      const mensajesTotales = await prisma.ewoorkerMensajeChat.count({
        where: dateFilter,
      });

      // Documentos
      const proximaFechaAlerta = new Date();
      proximaFechaAlerta.setDate(proximaFechaAlerta.getDate() + 30);

      const [docsPendientes, docsProximosVencer, docsVencidos] = await Promise.all([
        prisma.ewoorkerDocumento.count({ where: { estado: 'pendiente' } }),
        prisma.ewoorkerDocumento.count({
          where: {
            fechaCaducidad: { lte: proximaFechaAlerta, gt: now },
            estado: 'aprobado',
          },
        }),
        prisma.ewoorkerDocumento.count({
          where: { fechaCaducidad: { lte: now }, estado: 'aprobado' },
        }),
      ]);

      return {
        totalEmpresas,
        empresasActivas,
        empresasVerificadas,
        nuevasEmpresasHoy: nuevasHoy,
        nuevasEmpresasSemana: nuevasSemana,
        nuevasEmpresasMes: nuevasMes,

        totalObras: obrasStats._count.id,
        obrasActivas,
        obrasCompletadas,
        valorTotalObras: obrasStats._sum.presupuestoMaximo || 0,

        totalOfertas: ofertasStats[0],
        ofertasHoy: ofertasStats[1],
        tasaConversion:
          ofertasStats[0] > 0 ? Math.round((ofertasStats[2] / ofertasStats[0]) * 100) : 0,

        totalContratos: contratosStats._count.id,
        contratosActivos,
        valorMedioContrato: contratosStats._avg.montoTotal || 0,

        volumenTransacciones: transacciones._sum.monto || 0,
        comisionesGeneradas:
          (transacciones._sum.beneficioSocio || 0) + (transacciones._sum.beneficioPlataforma || 0),
        ingresosSocio: transacciones._sum.beneficioSocio || 0,
        ingresosPlataforma: transacciones._sum.beneficioPlataforma || 0,

        usuariosActivosDiarios: activosDiarios,
        usuariosActivosSemanales: activosSemanales,
        usuariosActivosMensuales: activosMensuales,
        mensajesTotales,

        documentosPendientes: docsPendientes,
        documentosProximosVencer: docsProximosVencer,
        documentosVencidos: docsVencidos,
      };
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error obteniendo métricas de plataforma:', error);
      return {
        totalEmpresas: 0,
        empresasActivas: 0,
        empresasVerificadas: 0,
        nuevasEmpresasHoy: 0,
        nuevasEmpresasSemana: 0,
        nuevasEmpresasMes: 0,
        totalObras: 0,
        obrasActivas: 0,
        obrasCompletadas: 0,
        valorTotalObras: 0,
        totalOfertas: 0,
        ofertasHoy: 0,
        tasaConversion: 0,
        totalContratos: 0,
        contratosActivos: 0,
        valorMedioContrato: 0,
        volumenTransacciones: 0,
        comisionesGeneradas: 0,
        ingresosSocio: 0,
        ingresosPlataforma: 0,
        usuariosActivosDiarios: 0,
        usuariosActivosSemanales: 0,
        usuariosActivosMensuales: 0,
        mensajesTotales: 0,
        documentosPendientes: 0,
        documentosProximosVencer: 0,
        documentosVencidos: 0,
      };
    }
  }

  /**
   * Obtiene tendencia de una métrica
   */
  async getTrend(
    metric: 'empresas' | 'obras' | 'ofertas' | 'contratos' | 'transacciones',
    days: number = 30
  ): Promise<TrendData[]> {
    try {
      const results: TrendData[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        let count = 0;

        switch (metric) {
          case 'empresas':
            count = await prisma.ewoorkerPerfilEmpresa.count({
              where: { createdAt: { gte: date, lt: nextDate } },
            });
            break;
          case 'obras':
            count = await prisma.ewoorkerObra.count({
              where: { createdAt: { gte: date, lt: nextDate } },
            });
            break;
          case 'ofertas':
            count = await prisma.ewoorkerOferta.count({
              where: { createdAt: { gte: date, lt: nextDate } },
            });
            break;
          case 'contratos':
            count = await prisma.ewoorkerContrato.count({
              where: { createdAt: { gte: date, lt: nextDate } },
            });
            break;
          case 'transacciones':
            const sum = await prisma.ewoorkerTransaccion.aggregate({
              where: { createdAt: { gte: date, lt: nextDate }, estado: 'completado' },
              _sum: { monto: true },
            });
            count = sum._sum.monto || 0;
            break;
        }

        results.push({
          date: date.toISOString().split('T')[0],
          value: count,
        });
      }

      return results;
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error obteniendo tendencia:', error);
      return [];
    }
  }

  /**
   * Obtiene distribución geográfica
   */
  async getGeographicDistribution(): Promise<
    { provincia: string; count: number; percentage: number }[]
  > {
    try {
      const results = await prisma.ewoorkerPerfilEmpresa.groupBy({
        by: ['zonasOperacion'],
        _count: { id: true },
      });

      // Aplanar y contar por provincia
      const provinciaCounts = new Map<string, number>();
      let total = 0;

      for (const result of results) {
        const zonas = (result.zonasOperacion as string[]) || [];
        for (const zona of zonas) {
          const current = provinciaCounts.get(zona) || 0;
          provinciaCounts.set(zona, current + result._count.id);
          total += result._count.id;
        }
      }

      // Convertir a array ordenado
      return Array.from(provinciaCounts.entries())
        .map(([provincia, count]) => ({
          provincia,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error obteniendo distribución geográfica:', error);
      return [];
    }
  }

  /**
   * Obtiene distribución por especialidad
   */
  async getSpecialtyDistribution(): Promise<
    { especialidad: string; count: number; percentage: number }[]
  > {
    try {
      const results = await prisma.ewoorkerPerfilEmpresa.groupBy({
        by: ['especialidadPrincipal'],
        _count: { id: true },
        where: { especialidadPrincipal: { not: null } },
        orderBy: { _count: { id: 'desc' } },
      });

      const total = results.reduce((sum, r) => sum + r._count.id, 0);

      return results.map((r) => ({
        especialidad: r.especialidadPrincipal || 'Otro',
        count: r._count.id,
        percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
      }));
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error obteniendo distribución por especialidad:', error);
      return [];
    }
  }

  /**
   * Exporta métricas a CSV
   */
  async exportMetricsCSV(perfilEmpresaId?: string, timeRange?: TimeRange): Promise<string> {
    try {
      let data: Record<string, any>;

      if (perfilEmpresaId) {
        data = (await this.getPerfilMetrics(perfilEmpresaId, timeRange)) || {};
      } else {
        data = await this.getPlatformMetrics(timeRange);
      }

      // Convertir a CSV
      const headers = Object.keys(data).join(',');
      const values = Object.values(data).join(',');

      return `${headers}\n${values}`;
    } catch (error: any) {
      logger.error('[EwoorkerAnalytics] Error exportando CSV:', error);
      return '';
    }
  }
}

// Exportar instancia singleton
export const ewoorkerAnalytics = new EwoorkerAnalyticsService();

export default ewoorkerAnalytics;
