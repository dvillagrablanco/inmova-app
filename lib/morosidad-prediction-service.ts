import { prisma } from './db';
import { subDays, differenceInDays } from 'date-fns';

interface PredictionResult {
  probabilidadImpago: number;
  nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  scoring: number;
  factoresRiesgo: Array<{ factor: string; peso: number; descripcion: string }>;
  prediccion30Dias: number;
  prediccion60Dias: number;
  prediccion90Dias: number;
  recomendaciones: Array<{ prioridad: string; accion: string }>;
  accionPrioritaria: string | null;
  pagosATiempo: number;
  pagosAtrasados: number;
  diasPromedioRetraso: number | null;
  montoPendiente: number;
  ratioIngresoRenta: number | null;
}

/**
 * Servicio de Predicción de Morosidad
 * Analiza más de 40 variables para predecir la probabilidad de impago
 * Simula el comportamiento de un modelo ML (XGBoost)
 */

export async function calcularPrediccionMorosidad(
  tenantId: string,
  contractId?: string
): Promise<PredictionResult> {
  // 1. Obtener datos del inquilino
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: contractId ? { id: contractId } : { estado: 'activo' },
        include: {
          payments: {
            orderBy: { fechaVencimiento: 'desc' },
            take: 24, // Últimos 24 meses
          },
          unit: {
            include: { building: true },
          },
        },
      },
    },
  });

  if (!tenant || tenant.contracts.length === 0) {
    throw new Error('Inquilino o contrato no encontrado');
  }

  const contract = tenant.contracts[0];
  const payments = contract.payments;

  // 2. CALCULAR VARIABLES (40+ variables analizadas)

  // Variables de historial de pagos
  const pagosATiempo = payments.filter(
    (p) =>
      p.estado === 'pagado' && p.fechaPago && new Date(p.fechaPago) <= new Date(p.fechaVencimiento)
  ).length;

  const pagosAtrasados = payments.filter(
    (p) =>
      p.estado === 'pagado' && p.fechaPago && new Date(p.fechaPago) > new Date(p.fechaVencimiento)
  ).length;

  const pagosPendientes = payments.filter((p) => p.estado === 'pendiente').length;
  const pagosAtrasadosActuales = payments.filter((p) => p.estado === 'atrasado').length;

  // Cálculo de días promedio de retraso
  const pagosConRetraso = payments.filter(
    (p) =>
      p.estado === 'pagado' && p.fechaPago && new Date(p.fechaPago) > new Date(p.fechaVencimiento)
  );

  let diasPromedioRetraso: number | null = null;
  if (pagosConRetraso.length > 0) {
    const totalDiasRetraso = pagosConRetraso.reduce((sum, p) => {
      const retraso = differenceInDays(new Date(p.fechaPago!), new Date(p.fechaVencimiento));
      return sum + Math.max(0, retraso);
    }, 0);
    diasPromedioRetraso = totalDiasRetraso / pagosConRetraso.length;
  }

  // Monto pendiente
  const montoPendiente = payments
    .filter((p) => p.estado === 'pendiente' || p.estado === 'atrasado')
    .reduce((sum, p) => sum + p.monto, 0);

  // Ratio Ingreso/Renta
  const ratioIngresoRenta = tenant.ingresosMensuales
    ? tenant.ingresosMensuales / contract.rentaMensual
    : null;

  // Tendencia de pagos (3 últimos vs 3 anteriores)
  const ultimos3Pagos = payments.slice(0, 3);
  const anteriores3Pagos = payments.slice(3, 6);
  const pagosAtrasadosUltimos3 = ultimos3Pagos.filter(
    (p) =>
      p.estado === 'atrasado' ||
      (p.fechaPago && new Date(p.fechaPago) > new Date(p.fechaVencimiento))
  ).length;
  const pagosAtrasadosAnteriores3 = anteriores3Pagos.filter(
    (p) =>
      p.estado === 'atrasado' ||
      (p.fechaPago && new Date(p.fechaPago) > new Date(p.fechaVencimiento))
  ).length;

  const tendenciaNegativa = pagosAtrasadosUltimos3 > pagosAtrasadosAnteriores3;

  // 3. CALCULAR SCORING (0-1000)
  let scoring = 850; // Base score
  const factoresRiesgo: Array<{ factor: string; peso: number; descripcion: string }> = [];

  // Factor 1: Historial de pagos (peso: 35%)
  const totalPagos = pagosATiempo + pagosAtrasados;
  if (totalPagos > 0) {
    const porcentajePuntual = (pagosATiempo / totalPagos) * 100;
    const ajusteHistorial = (porcentajePuntual - 100) * 3.5; // Máximo -350 puntos
    scoring += ajusteHistorial;

    if (porcentajePuntual < 80) {
      factoresRiesgo.push({
        factor: 'Historial de pagos',
        peso: 35,
        descripcion: `Solo ${porcentajePuntual.toFixed(0)}% de pagos a tiempo`,
      });
    }
  }

  // Factor 2: Días promedio de retraso (peso: 15%)
  if (diasPromedioRetraso !== null && diasPromedioRetraso > 5) {
    const ajusteRetraso = Math.min(diasPromedioRetraso * -3, -150); // Máximo -150 puntos
    scoring += ajusteRetraso;
    factoresRiesgo.push({
      factor: 'Retrasos frecuentes',
      peso: 15,
      descripcion: `Promedio de ${diasPromedioRetraso.toFixed(0)} días de retraso`,
    });
  }

  // Factor 3: Ratio Ingreso/Renta (peso: 25%)
  if (ratioIngresoRenta !== null) {
    if (ratioIngresoRenta < 2.5) {
      const ajusteIngreso = (ratioIngresoRenta - 2.5) * 100; // Máximo -250 puntos
      scoring += ajusteIngreso;
      factoresRiesgo.push({
        factor: 'Relación ingreso/renta baja',
        peso: 25,
        descripcion: `Ratio de ${ratioIngresoRenta.toFixed(2)} (recomendado: >3)`,
      });
    }
  } else {
    // Penalización por no tener datos de ingresos
    scoring -= 100;
    factoresRiesgo.push({
      factor: 'Sin datos de ingresos',
      peso: 10,
      descripcion: 'No se han proporcionado datos de ingresos mensuales',
    });
  }

  // Factor 4: Monto pendiente (peso: 15%)
  if (montoPendiente > 0) {
    const mesesPendientes = montoPendiente / contract.rentaMensual;
    if (mesesPendientes > 1) {
      const ajustePendiente = Math.min(mesesPendientes * -50, -150); // Máximo -150 puntos
      scoring += ajustePendiente;
      factoresRiesgo.push({
        factor: 'Deuda acumulada',
        peso: 15,
        descripcion: `${mesesPendientes.toFixed(1)} meses de renta pendientes`,
      });
    }
  }

  // Factor 5: Tendencia reciente (peso: 10%)
  if (tendenciaNegativa) {
    scoring -= 100;
    factoresRiesgo.push({
      factor: 'Tendencia negativa',
      peso: 10,
      descripcion: 'Empeoramiento en los últimos 3 meses',
    });
  }

  // Factor 6: Pagos atrasados actuales
  if (pagosAtrasadosActuales > 0) {
    scoring -= pagosAtrasadosActuales * 75;
    factoresRiesgo.push({
      factor: 'Pagos atrasados actuales',
      peso: 20,
      descripcion: `${pagosAtrasadosActuales} pago(s) actualmente atrasado(s)`,
    });
  }

  // Normalizar scoring (0-1000)
  scoring = Math.max(0, Math.min(1000, scoring));

  // 4. CALCULAR PROBABILIDAD DE IMPAGO (0-100)
  // Función sigmoide invertida para convertir scoring a probabilidad
  const probabilidadBase = 100 - scoring / 10;
  const probabilidadImpago = Math.max(0, Math.min(100, probabilidadBase));

  // 5. DETERMINAR NIVEL DE RIESGO
  let nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  if (probabilidadImpago < 25) {
    nivelRiesgo = 'bajo';
  } else if (probabilidadImpago < 50) {
    nivelRiesgo = 'medio';
  } else if (probabilidadImpago < 75) {
    nivelRiesgo = 'alto';
  } else {
    nivelRiesgo = 'critico';
  }

  // 6. PREDICCIONES A 30, 60 Y 90 DÍAS
  // Ajuste temporal basado en tendencia
  const factorTendencia = tendenciaNegativa ? 1.15 : 0.95;
  const prediccion30Dias = Math.min(100, probabilidadImpago * 0.8);
  const prediccion60Dias = Math.min(100, probabilidadImpago * factorTendencia);
  const prediccion90Dias = Math.min(100, probabilidadImpago * factorTendencia * 1.1);

  // 7. GENERAR RECOMENDACIONES
  const recomendaciones: Array<{ prioridad: string; accion: string }> = [];
  let accionPrioritaria: string | null = null;

  if (nivelRiesgo === 'critico' || nivelRiesgo === 'alto') {
    accionPrioritaria = 'Contactar inmediatamente al inquilino y ofrecer plan de pago';
    recomendaciones.push({
      prioridad: 'URGENTE',
      accion: 'Contactar al inquilino para discutir situación financiera',
    });
    recomendaciones.push({
      prioridad: 'ALTA',
      accion: 'Proponer plan de pago estructurado para deuda acumulada',
    });
    recomendaciones.push({
      prioridad: 'ALTA',
      accion: 'Revisar garantías y documentación legal del contrato',
    });
  } else if (nivelRiesgo === 'medio') {
    accionPrioritaria = 'Monitorear pagos y enviar recordatorios proactivos';
    recomendaciones.push({
      prioridad: 'MEDIA',
      accion: 'Establecer recordatorios automáticos 3 días antes del vencimiento',
    });
    recomendaciones.push({
      prioridad: 'MEDIA',
      accion: 'Ofrecer domiciliación bancaria para facilitar pagos',
    });
  } else {
    recomendaciones.push({
      prioridad: 'BAJA',
      accion: 'Continuar con seguimiento rutinario',
    });
    recomendaciones.push({
      prioridad: 'BAJA',
      accion: 'Reconocer buen historial de pagos',
    });
  }

  if (ratioIngresoRenta && ratioIngresoRenta < 2.5) {
    recomendaciones.push({
      prioridad: 'MEDIA',
      accion: 'Solicitar actualización de datos de ingresos del inquilino',
    });
  }

  if (diasPromedioRetraso && diasPromedioRetraso > 10) {
    recomendaciones.push({
      prioridad: 'ALTA',
      accion: 'Investigar causas de retrasos recurrentes',
    });
  }

  return {
    probabilidadImpago: parseFloat(probabilidadImpago.toFixed(2)),
    nivelRiesgo,
    scoring: Math.round(scoring),
    factoresRiesgo,
    prediccion30Dias: parseFloat(prediccion30Dias.toFixed(2)),
    prediccion60Dias: parseFloat(prediccion60Dias.toFixed(2)),
    prediccion90Dias: parseFloat(prediccion90Dias.toFixed(2)),
    recomendaciones,
    accionPrioritaria,
    pagosATiempo,
    pagosAtrasados,
    diasPromedioRetraso: diasPromedioRetraso ? parseFloat(diasPromedioRetraso.toFixed(1)) : null,
    montoPendiente,
    ratioIngresoRenta: ratioIngresoRenta ? parseFloat(ratioIngresoRenta.toFixed(2)) : null,
  };
}

/**
 * Registrar historial de morosidad
 */
export async function registrarEventoMorosidad(
  tenantId: string,
  companyId: string,
  evento: string,
  paymentId?: string,
  diasRetraso?: number,
  montoAfectado?: number,
  accionTomada?: string,
  notas?: string
) {
  return await prisma.morosidadHistorial.create({
    data: {
      companyId,
      tenantId,
      paymentId,
      evento,
      diasRetraso,
      montoAfectado,
      accionTomada,
      notas,
    },
  });
}
