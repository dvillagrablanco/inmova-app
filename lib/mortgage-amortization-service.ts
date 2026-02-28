/**
 * Mortgage Amortization Service
 *
 * Genera automáticamente la tabla de amortización completa de una hipoteca
 * con sistema francés (cuota constante), que es el estándar en España.
 *
 * Al crear/modificar una hipoteca, se pre-generan todos los MortgagePayment
 * para la vida del préstamo, facilitando:
 * - Proyección de intereses deducibles (IS)
 * - Cálculo de capital pendiente en cualquier fecha
 * - Dashboard de tesorería con pagos comprometidos
 */

import logger from '@/lib/logger';

export interface AmortizationEntry {
  numero: number;
  fecha: Date;
  cuotaTotal: number;
  capital: number;
  intereses: number;
  capitalPendiente: number;
}

/**
 * Calcula la tabla de amortización completa (sistema francés)
 */
export function calculateAmortizationTable(params: {
  capitalInicial: number;
  tipoInteresAnual: number; // %
  plazoAnos: number;
  fechaInicio: Date;
  diaVencimiento?: number;
  periodoCarencia?: number; // meses
}): AmortizationEntry[] {
  const {
    capitalInicial,
    tipoInteresAnual,
    plazoAnos,
    fechaInicio,
    diaVencimiento = 1,
    periodoCarencia = 0,
  } = params;

  const totalMeses = plazoAnos * 12;
  const tipoMensual = tipoInteresAnual / 100 / 12;
  const entries: AmortizationEntry[] = [];

  // Cuota mensual (sistema francés): C = P * [r(1+r)^n] / [(1+r)^n - 1]
  const mesesAmortizacion = totalMeses - periodoCarencia;
  let cuotaMensual: number;

  if (tipoMensual === 0) {
    cuotaMensual = capitalInicial / mesesAmortizacion;
  } else {
    const factor = Math.pow(1 + tipoMensual, mesesAmortizacion);
    cuotaMensual = capitalInicial * (tipoMensual * factor) / (factor - 1);
  }

  cuotaMensual = Math.round(cuotaMensual * 100) / 100;

  let capitalPendiente = capitalInicial;

  for (let mes = 1; mes <= totalMeses; mes++) {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + mes);
    fecha.setDate(Math.min(diaVencimiento, getDaysInMonth(fecha)));

    const intereses = Math.round(capitalPendiente * tipoMensual * 100) / 100;

    if (mes <= periodoCarencia) {
      // Período de carencia: solo se pagan intereses
      entries.push({
        numero: mes,
        fecha,
        cuotaTotal: intereses,
        capital: 0,
        intereses,
        capitalPendiente: Math.round(capitalPendiente * 100) / 100,
      });
    } else {
      const capital = Math.round((cuotaMensual - intereses) * 100) / 100;
      capitalPendiente = Math.max(0, capitalPendiente - capital);

      // Último pago: ajustar para cerrar exactamente a 0
      const isLast = mes === totalMeses;
      const capitalFinal = isLast ? capitalPendiente + capital : capital;
      const cuotaFinal = isLast ? capitalFinal + intereses : cuotaMensual;

      if (isLast) capitalPendiente = 0;

      entries.push({
        numero: mes,
        fecha,
        cuotaTotal: Math.round(cuotaFinal * 100) / 100,
        capital: Math.round(capitalFinal * 100) / 100,
        intereses,
        capitalPendiente: Math.round(capitalPendiente * 100) / 100,
      });
    }
  }

  return entries;
}

/**
 * Genera y persiste la tabla de amortización de una hipoteca en BD
 */
export async function generateMortgageAmortizationTable(mortgageId: string): Promise<number> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const mortgage = await prisma.mortgage.findUnique({
    where: { id: mortgageId },
  });

  if (!mortgage) throw new Error('Hipoteca no encontrada');

  const table = calculateAmortizationTable({
    capitalInicial: mortgage.capitalInicial,
    tipoInteresAnual: mortgage.tipoInteres,
    plazoAnos: mortgage.plazoAnos,
    fechaInicio: mortgage.fechaConstitucion,
    diaVencimiento: mortgage.diaVencimiento,
    periodoCarencia: mortgage.periodoCarencia || 0,
  });

  // Eliminar tabla anterior
  await prisma.mortgagePayment.deleteMany({
    where: { mortgageId },
  });

  // Insertar nueva tabla
  await prisma.mortgagePayment.createMany({
    data: table.map(entry => ({
      mortgageId,
      fecha: entry.fecha,
      cuotaTotal: entry.cuotaTotal,
      capital: entry.capital,
      intereses: entry.intereses,
      capitalPendiente: entry.capitalPendiente,
      pagado: entry.fecha < new Date(), // Marcar como pagados los pasados
    })),
  });

  logger.info(`[Mortgage Amortization] Generated ${table.length} payments for mortgage ${mortgageId}`);
  return table.length;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
