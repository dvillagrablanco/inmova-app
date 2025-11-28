import { prisma } from './db';
import { addDays, differenceInDays, subMonths } from 'date-fns';

/**
 * Analiza el historial de mantenimiento y predice posibles fallas
 */
export async function predictEquipmentFailures(companyId: string) {
  // Obtener historial de mantenimiento de los últimos 24 meses
  const cutoffDate = subMonths(new Date(), 24);
  
  const maintenanceHistory = await prisma.maintenanceHistory.findMany({
    where: {
      fechaDeteccion: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      fechaDeteccion: 'desc',
    },
  });

  // Agrupar por equipo/sistema
  const equipmentStats = new Map<string, any>();

  for (const record of maintenanceHistory) {
    const key = record.equipoSistema;
    
    if (!equipmentStats.has(key)) {
      equipmentStats.set(key, {
        equipoSistema: key,
        buildingId: record.buildingId,
        unitId: record.unitId,
        problemas: [],
        ultimaReparacion: record.fechaReparacion,
        costoTotal: 0,
        tiempoTotalReparacion: 0,
        numeroFallas: 0,
      });
    }

    const stats = equipmentStats.get(key);
    stats.problemas.push({
      tipo: record.tipoProblema,
      fecha: record.fechaDeteccion,
      costo: record.costoReparacion || 0,
      tiempo: record.tiempoReparacion || 0,
    });
    stats.costoTotal += record.costoReparacion || 0;
    stats.tiempoTotalReparacion += record.tiempoReparacion || 0;
    stats.numeroFallas += 1;
  }

  const predictions = [];

  for (const [equipo, stats] of equipmentStats) {
    if (stats.numeroFallas < 2) continue; // Necesitamos al menos 2 fallas para predecir

    // Calcular tiempo promedio entre fallas
    const fechas = stats.problemas.map((p: any) => new Date(p.fecha)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const intervalos = [];
    for (let i = 1; i < fechas.length; i++) {
      intervalos.push(differenceInDays(fechas[i], fechas[i - 1]));
    }
    
    const intervaloPromedio = intervalos.length > 0 
      ? intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length 
      : 180;

    // Calcular probabilidad de falla
    const diasDesdeFalla = stats.ultimaReparacion 
      ? differenceInDays(new Date(), new Date(stats.ultimaReparacion))
      : 365;

    const probabilidad = Math.min((diasDesdeFalla / intervaloPromedio) * 100, 95);
    const diasEstimados = Math.max(intervaloPromedio - diasDesdeFalla, 0);

    // Factores de riesgo
    const factoresRiesgo = [];
    if (stats.numeroFallas > 5) factoresRiesgo.push('Alto historial de fallas');
    if (stats.costoTotal > 2000) factoresRiesgo.push('Costos de reparación elevados');
    if (intervaloPromedio < 90) factoresRiesgo.push('Intervalos cortos entre fallas');
    if (diasDesdeFalla > intervaloPromedio * 0.8) factoresRiesgo.push('Próximo al tiempo promedio de falla');

    // Recomendaciones
    const recomendaciones = [];
    if (probabilidad > 70) {
      recomendaciones.push('Programar inspección urgente');
      recomendaciones.push('Verificar disponibilidad de repuestos');
    }
    if (probabilidad > 50) {
      recomendaciones.push('Realizar mantenimiento preventivo');
    }
    recomendaciones.push('Revisar manual de mantenimiento');

    const fechaObjetivo = addDays(new Date(), Math.round(diasEstimados));
    
    const confianza = Math.min(
      0.5 + (stats.numeroFallas * 0.05) + (intervalos.length > 3 ? 0.2 : 0),
      0.95
    );

    const prediction = {
      companyId,
      equipoSistema: equipo,
      buildingId: stats.buildingId,
      unitId: stats.unitId,
      probabilidadFalla: Math.round(probabilidad * 10) / 10,
      diasEstimados: Math.round(diasEstimados),
      factoresRiesgo: JSON.stringify(factoresRiesgo),
      recomendaciones: JSON.stringify(recomendaciones),
      historialAnalizado: stats.numeroFallas,
      confianza: Math.round(confianza * 100) / 100,
      estado: probabilidad > 70 ? 'critica' : probabilidad > 50 ? 'alerta' : 'activa',
      fechaObjetivo,
    };

    predictions.push(prediction);

    // Guardar en la base de datos
    await prisma.maintenanceFailurePrediction.create({
      data: prediction,
    });
  }

  return predictions;
}

/**
 * Genera un diagnóstico inteligente basado en síntomas
 */
export async function generateDiagnostic(
  maintenanceRequestId: string,
  equipoSistema: string,
  sintomas: string,
  creadoPor: string
) {
  // Buscar casos similares en el historial
  const similarCases = await prisma.maintenanceHistory.findMany({
    where: {
      equipoSistema: {
        contains: equipoSistema,
        mode: 'insensitive',
      },
    },
    orderBy: {
      fechaDeteccion: 'desc',
    },
    take: 10,
  });

  // Análisis de síntomas comunes
  const problemasComunes = new Map<string, number>();
  const solucionesExitosas = new Map<string, any>();

  for (const caso of similarCases) {
    problemasComunes.set(
      caso.tipoProblema,
      (problemasComunes.get(caso.tipoProblema) || 0) + 1
    );

    if (caso.solucionAplicada) {
      if (!solucionesExitosas.has(caso.tipoProblema)) {
        solucionesExitosas.set(caso.tipoProblema, {
          solucion: caso.solucionAplicada,
          repuestos: caso.repuestosUsados,
          costo: caso.costoReparacion,
          tiempo: caso.tiempoReparacion,
          frecuencia: 0,
        });
      }
      const sol = solucionesExitosas.get(caso.tipoProblema);
      sol.frecuencia += 1;
    }
  }

  // Determinar problema más probable
  let problemaMasProbable = '';
  let maxFrecuencia = 0;
  for (const [problema, frecuencia] of problemasComunes) {
    if (frecuencia > maxFrecuencia) {
      maxFrecuencia = frecuencia;
      problemaMasProbable = problema;
    }
  }

  // Generar diagnóstico
  let diagnostico = '';
  let causaProbable = '';
  let solucionSugerida = '';
  let repuestosNecesarios = null;
  let costoEstimado = null;
  let tiempoEstimado = null;
  let prioridad = 'media';
  let confianza = 0.5;

  if (problemaMasProbable && solucionesExitosas.has(problemaMasProbable)) {
    const solucion = solucionesExitosas.get(problemaMasProbable);
    diagnostico = `Basado en ${similarCases.length} casos similares, este problema coincide con: ${problemaMasProbable}`;
    causaProbable = `Causa probable: ${problemaMasProbable}. Este problema ha ocurrido ${maxFrecuencia} veces en este tipo de equipo.`;
    solucionSugerida = solucion.solucion;
    repuestosNecesarios = solucion.repuestos;
    costoEstimado = solucion.costo || null;
    tiempoEstimado = solucion.tiempo || null;
    confianza = Math.min(0.5 + (maxFrecuencia * 0.1), 0.95);

    // Determinar prioridad
    if (solucion.costo && solucion.costo > 1000) prioridad = 'alta';
    if (sintomas.toLowerCase().includes('fuga') || sintomas.toLowerCase().includes('emergencia')) {
      prioridad = 'alta';
    }
  } else {
    diagnostico = 'No se encontraron casos similares en el historial. Se recomienda inspección técnica.';
    causaProbable = 'Requiere evaluación por técnico especializado.';
    solucionSugerida = 'Programar visita de técnico para evaluación detallada.';
    confianza = 0.3;
  }

  const diagnostic = await prisma.maintenanceDiagnostic.create({
    data: {
      maintenanceRequestId,
      equipoSistema,
      sintomas,
      diagnostico,
      causaProbable,
      solucionSugerida,
      repuestosNecesarios,
      costoEstimado,
      tiempoEstimado,
      prioridad,
      confianza,
      creadoPor,
    },
  });

  return diagnostic;
}

/**
 * Calcula métricas de eficiencia de mantenimiento
 */
export async function calculateMaintenanceMetrics(companyId: string, periodo: string, buildingId?: string) {
  const [year, month] = periodo.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  // Filtro base
  const whereClause: any = {
    unit: {
      building: {
        companyId,
      },
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (buildingId) {
    whereClause.unit = {
      ...whereClause.unit,
      buildingId,
    };
  }

  // Obtener todas las solicitudes del período
  const solicitudes = await prisma.maintenanceRequest.findMany({
    where: whereClause,
    include: {
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  const completas = solicitudes.filter(s => s.estado === 'completado');
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const enProgreso = solicitudes.filter(s => s.estado === 'en_progreso');

  // Calcular tiempos promedio
  let tiempoRespuestaTotal = 0;
  let tiempoResolucionTotal = 0;
  let contadorRespuesta = 0;
  let contadorResolucion = 0;

  for (const solicitud of completas) {
    if (solicitud.fechaCompletada) {
      const tiempoResolucion = differenceInDays(
        new Date(solicitud.fechaCompletada),
        new Date(solicitud.createdAt)
      );
      tiempoResolucionTotal += tiempoResolucion;
      contadorResolucion += 1;
    }
    // Asumir tiempo de respuesta de 1 día si no hay datos específicos
    tiempoRespuestaTotal += 1;
    contadorRespuesta += 1;
  }

  const tiempoRespuestaPromedio = contadorRespuesta > 0 ? tiempoRespuestaTotal / contadorRespuesta : 0;
  const tiempoResolucionPromedio = contadorResolucion > 0 ? tiempoResolucionTotal / contadorResolucion : 0;

  // Calcular tasa de resolución en primera visita (asumimos 80% si no hay datos)
  const tasaResolucionPrimera = completas.length > 0 ? 80 : 0;

  // Calcular costos - como no hay tipo, usamos prioridad como proxy
  const costosPreventivo = solicitudes
    .filter(s => s.prioridad === 'baja')
    .reduce((sum, s) => sum + (s.costoEstimado || 0), 0);

  const costosCorrectivo = solicitudes
    .filter(s => s.prioridad === 'media')
    .reduce((sum, s) => sum + (s.costoEstimado || 0), 0);

  const costosEmergencia = solicitudes
    .filter(s => s.prioridad === 'alta')
    .reduce((sum, s) => sum + (s.costoEstimado || 0), 0);

  // Solicitudes atrasadas (más de 7 días desde creación y aún pendientes)
  const solicitudesAtrasadas = [...pendientes, ...enProgreso].filter(s => {
    const dias = differenceInDays(new Date(), new Date(s.createdAt));
    return dias > 7;
  }).length;

  const metrics = await prisma.maintenanceMetrics.create({
    data: {
      companyId,
      buildingId,
      periodo,
      tiempoRespuestaPromedio: Math.round(tiempoRespuestaPromedio * 10) / 10,
      tiempoResolucionPromedio: Math.round(tiempoResolucionPromedio * 10) / 10,
      tasaResolucionPrimera,
      costosPreventivo,
      costosCorrectivo,
      costosEmergencia,
      solicitudesCompletas: completas.length,
      solicitudesPendientes: pendientes.length + enProgreso.length,
      solicitudesAtrasadas,
      disponibilidadEquipos: 95, // Valor por defecto
    },
  });

  return metrics;
}
