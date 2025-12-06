import { prisma } from '@/lib/db';
import { addMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';

export interface ColivingMetrics {
  churnRate: number;
  ltvPromedio: number;
  ltvMinimo: number;
  ltvMaximo: number;
  npsScore: number | null;
  promedioEstanciaMeses: number;
  prediccionOcupacion: number;
  prediccionDisponibilidad: number;
}

export class ColivingAnalyticsService {
  /**
   * Calcula la tasa de rotación (churn rate) para un periodo específico
   */
  static async calculateChurnRate(companyId: string, periodo: Date) {
    const inicioMes = startOfMonth(periodo);
    const finMes = endOfMonth(periodo);

    // Obtener total de colivers activos al inicio del periodo
    const totalColivers = await prisma.roomContract.count({
      where: {
        companyId,
        fechaInicio: { lte: inicioMes },
        fechaFin: { gte: inicioMes },
        estado: 'activo',
      },
    });

    // Obtener colivers que se fueron durante el periodo
    const coliversSalieron = await prisma.roomContract.count({
      where: {
        companyId,
        fechaFin: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: { not: 'activo' },
      },
    });

    const churnRate = totalColivers > 0 ? (coliversSalieron / totalColivers) * 100 : 0;

    return {
      totalColivers,
      coliversSalieron,
      churnRate: parseFloat(churnRate.toFixed(2)),
    };
  }

  /**
   * Calcula el promedio de meses que los colivers permanecen
   */
  static async calculateAverageStayMonths(companyId: string) {
    const contracts = await prisma.roomContract.findMany({
      where: {
        companyId,
      },
      select: {
        fechaInicio: true,
        fechaFin: true,
      },
    });

    if (contracts.length === 0) return 0;

    const totalMonths = contracts.reduce((sum, contract) => {
      if (contract.fechaFin) {
        return sum + differenceInMonths(contract.fechaFin, contract.fechaInicio);
      }
      return sum;
    }, 0);

    return parseFloat((totalMonths / contracts.length).toFixed(2));
  }

  /**
   * Calcula el Lifetime Value (LTV) de los colivers
   */
  static async calculateLTV(companyId: string) {
    // Obtener todos los pagos completados por tenant
    const tenantPayments = await prisma.roomPayment.groupBy({
      by: ['contractId'],
      where: {
        companyId,
        estado: 'pagado',
      },
      _sum: {
        monto: true,
      },
    });

    if (tenantPayments.length === 0) {
      return {
        ltvPromedio: 0,
        ltvMinimo: 0,
        ltvMaximo: 0,
      };
    }

    const ltvValues = tenantPayments
      .map((tp) => tp._sum.monto || 0)
      .filter((v: number) => v > 0);

    if (ltvValues.length === 0) {
      return {
        ltvPromedio: 0,
        ltvMinimo: 0,
        ltvMaximo: 0,
      };
    }

    const ltvPromedio = ltvValues.reduce((a: number, b: number) => a + b, 0) / ltvValues.length;
    const ltvMinimo = Math.min(...ltvValues);
    const ltvMaximo = Math.max(...ltvValues);

    return {
      ltvPromedio: parseFloat(ltvPromedio.toFixed(2)),
      ltvMinimo: parseFloat(ltvMinimo.toFixed(2)),
      ltvMaximo: parseFloat(ltvMaximo.toFixed(2)),
    };
  }

  /**
   * Calcula el Net Promoter Score (NPS) basado en encuestas
   */
  static async calculateNPS(companyId: string, periodo: Date) {
    const inicioMes = startOfMonth(periodo);
    const finMes = endOfMonth(periodo);

    const surveys = await prisma.nPSSurvey.findMany({
      where: {
        companyId,
        fechaEncuesta: {
          gte: inicioMes,
          lte: finMes,
        },
        respondido: true,
      },
    });

    if (surveys.length === 0) {
      return {
        totalEncuestas: 0,
        promotores: 0,
        pasivos: 0,
        detractores: 0,
        npsScore: null,
      };
    }

    const promotores = surveys.filter((s: any) => s.score >= 9).length;
    const pasivos = surveys.filter((s: any) => s.score >= 7 && s.score <= 8).length;
    const detractores = surveys.filter((s: any) => s.score <= 6).length;

    const npsScore = ((promotores - detractores) / surveys.length) * 100;

    return {
      totalEncuestas: surveys.length,
      promotores,
      pasivos,
      detractores,
      npsScore: parseFloat(npsScore.toFixed(2)),
    };
  }

  /**
   * Analiza el perfil ideal de inquilino basado en datos históricos
   */
  static async analyzeIdealTenantProfile(companyId: string) {
    // Obtener los mejores inquilinos (con más tiempo de permanencia y sin incidentes)
    const contracts = await prisma.roomContract.findMany({
      where: {
        companyId,
        estado: 'activo',
      },
      include: {
        tenant: {
          include: {
            tenantProfile: true,
          },
        },
      },
    });

    // Filtrar inquilinos con perfil completo
    const tenantsWithProfile = contracts
      .filter((c: any) => c.tenant.tenantProfile)
      .map((c: any) => ({
        profile: c.tenant.tenantProfile!,
        monthsStayed: differenceInMonths(new Date(), c.fechaInicio),
      }))
      .filter((t: any) => t.monthsStayed >= 3); // Al menos 3 meses de estancia

    if (tenantsWithProfile.length === 0) {
      return {
        perfilIdealEdadMin: null,
        perfilIdealEdadMax: null,
        perfilIdealOcupacion: null,
        perfilIdealIngresoMin: null,
        perfilIdealEstanciaMeses: null,
      };
    }

    // Calcular estadísticas
    const edades = tenantsWithProfile.map((t: any) => t.profile.edad).filter((e: any): e is number => e !== null);
    const ingresos = tenantsWithProfile.map((t: any) => t.profile.ingresos).filter((i: any): i is number => i !== null);
    const ocupaciones = tenantsWithProfile.map((t: any) => t.profile.ocupacion).filter((o: any): o is string => o !== null);

    // Ocupación más común
    const ocupacionCounts: Record<string, number> = {};
    ocupaciones.forEach((o: string) => {
      ocupacionCounts[o] = (ocupacionCounts[o] || 0) + 1;
    });
    const perfilIdealOcupacion = Object.keys(ocupacionCounts).sort((a, b) => ocupacionCounts[b] - ocupacionCounts[a])[0] || null;

    // Promedio de estancia
    const promedioEstancia = tenantsWithProfile.reduce((sum: number, t: any) => sum + t.monthsStayed, 0) / tenantsWithProfile.length;

    return {
      perfilIdealEdadMin: edades.length > 0 ? Math.min(...edades) : null,
      perfilIdealEdadMax: edades.length > 0 ? Math.max(...edades) : null,
      perfilIdealOcupacion,
      perfilIdealIngresoMin: ingresos.length > 0 ? Math.min(...ingresos) : null,
      perfilIdealEstanciaMeses: parseInt(promedioEstancia.toFixed(0)),
    };
  }

  /**
   * Predice la ocupación para el próximo mes
   */
  static async predictOccupancy(companyId: string) {
    // Total de habitaciones
    const totalRooms = await prisma.room.count({
      where: { companyId },
    });

    if (totalRooms === 0) {
      return {
        prediccionOcupacionProximoMes: 0,
        prediccionDisponibilidadRoomsProximoMes: 0,
        nivelConfianzaPrediccion: 'neutro' as const,
      };
    }

    const proximoMes = addMonths(new Date(), 1);
    const inicioProximoMes = startOfMonth(proximoMes);
    const finProximoMes = endOfMonth(proximoMes);

    // Contratos activos que seguirán vigentes el próximo mes
    const contractosVigentes = await prisma.roomContract.count({
      where: {
        companyId,
        fechaInicio: { lte: inicioProximoMes },
        fechaFin: { gte: finProximoMes },
        estado: 'activo',
      },
    });

    const prediccionOcupacion = (contractosVigentes / totalRooms) * 100;
    const prediccionDisponibilidad = totalRooms - contractosVigentes;

    // Nivel de confianza basado en datos históricos
    let nivelConfianza: 'favorable' | 'neutro' | 'desfavorable' = 'neutro';
    if (prediccionOcupacion >= 80) {
      nivelConfianza = 'favorable';
    } else if (prediccionOcupacion < 50) {
      nivelConfianza = 'desfavorable';
    }

    return {
      prediccionOcupacionProximoMes: parseFloat(prediccionOcupacion.toFixed(2)),
      prediccionDisponibilidadRoomsProximoMes: prediccionDisponibilidad,
      nivelConfianzaPrediccion: nivelConfianza,
    };
  }

  /**
   * Genera un análisis completo para un periodo
   */
  static async generateAnalytics(companyId: string, periodo: Date) {
    const [churnData, ltvData, npsData, profileData, occupancyData] = await Promise.all([
      this.calculateChurnRate(companyId, periodo),
      this.calculateLTV(companyId),
      this.calculateNPS(companyId, periodo),
      this.analyzeIdealTenantProfile(companyId),
      this.predictOccupancy(companyId),
    ]);

    const promedioEstanciaMeses = await this.calculateAverageStayMonths(companyId);

    // Guardar o actualizar en la base de datos
    const analytics = await prisma.colivingAnalytics.upsert({
      where: {
        companyId_periodo: {
          companyId,
          periodo: startOfMonth(periodo),
        },
      },
      create: {
        companyId,
        periodo: startOfMonth(periodo),
        mes: periodo.getMonth() + 1,
        anio: periodo.getFullYear(),
        totalColivers: churnData.totalColivers,
        coliversSalieron: churnData.coliversSalieron,
        churnRate: churnData.churnRate,
        promedioEstanciaMeses,
        ltvPromedio: ltvData.ltvPromedio,
        ltvMinimo: ltvData.ltvMinimo,
        ltvMaximo: ltvData.ltvMaximo,
        totalEncuestas: npsData.totalEncuestas,
        promotores: npsData.promotores,
        pasivos: npsData.pasivos,
        detractores: npsData.detractores,
        npsScore: npsData.npsScore,
        perfilIdealEdadMin: profileData.perfilIdealEdadMin,
        perfilIdealEdadMax: profileData.perfilIdealEdadMax,
        perfilIdealOcupacion: profileData.perfilIdealOcupacion,
        perfilIdealIngresoMin: profileData.perfilIdealIngresoMin,
        perfilIdealEstanciaMeses: profileData.perfilIdealEstanciaMeses,
        prediccionOcupacionProximoMes: occupancyData.prediccionOcupacionProximoMes,
        prediccionDisponibilidadRoomsProximoMes: occupancyData.prediccionDisponibilidadRoomsProximoMes,
        nivelConfianzaPrediccion: occupancyData.nivelConfianzaPrediccion,
      },
      update: {
        totalColivers: churnData.totalColivers,
        coliversSalieron: churnData.coliversSalieron,
        churnRate: churnData.churnRate,
        promedioEstanciaMeses,
        ltvPromedio: ltvData.ltvPromedio,
        ltvMinimo: ltvData.ltvMinimo,
        ltvMaximo: ltvData.ltvMaximo,
        totalEncuestas: npsData.totalEncuestas,
        promotores: npsData.promotores,
        pasivos: npsData.pasivos,
        detractores: npsData.detractores,
        npsScore: npsData.npsScore,
        perfilIdealEdadMin: profileData.perfilIdealEdadMin,
        perfilIdealEdadMax: profileData.perfilIdealEdadMax,
        perfilIdealOcupacion: profileData.perfilIdealOcupacion,
        perfilIdealIngresoMin: profileData.perfilIdealIngresoMin,
        perfilIdealEstanciaMeses: profileData.perfilIdealEstanciaMeses,
        prediccionOcupacionProximoMes: occupancyData.prediccionOcupacionProximoMes,
        prediccionDisponibilidadRoomsProximoMes: occupancyData.prediccionDisponibilidadRoomsProximoMes,
        nivelConfianzaPrediccion: occupancyData.nivelConfianzaPrediccion,
      },
    });

    return analytics;
  }

  /**
   * Crea una encuesta NPS automática para un tenant
   */
  static async createNPSSurvey(companyId: string, tenantId: string) {
    const survey = await prisma.nPSSurvey.create({
      data: {
        companyId,
        tenantId,
        score: 0,
        categoria: 'detractor',
        fechaEncuesta: new Date(),
        respondido: false,
      },
    });

    return survey;
  }

  /**
   * Actualiza una encuesta NPS con la respuesta del tenant
   */
  static async updateNPSSurvey(
    surveyId: string,
    score: number,
    comentario?: string
  ) {
    // Determinar categoría según el score
    let categoria: 'promotor' | 'pasivo' | 'detractor';
    if (score >= 9) {
      categoria = 'promotor';
    } else if (score >= 7) {
      categoria = 'pasivo';
    } else {
      categoria = 'detractor';
    }

    const survey = await prisma.nPSSurvey.update({
      where: { id: surveyId },
      data: {
        score,
        categoria,
        comentario,
        respondido: true,
      },
    });

    return survey;
  }
}
