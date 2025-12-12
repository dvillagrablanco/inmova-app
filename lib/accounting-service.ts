import { prisma } from './db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface TransactionSummary {
  ingresosTotales: number;
  gastosTotales: number;
  flujoNeto: number;
  ingresosRenta: number;
  ingresosDeposito: number;
  ingresosOtros: number;
  gastosMantenimiento: number;
  gastosImpuestos: number;
  gastosSeguros: number;
  gastosServicios: number;
  gastosOtros: number;
}

export async function calculateCashFlow(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<TransactionSummary> {
  // Obtener todas las transacciones del período
  const transactions = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
  });

  const summary: TransactionSummary = {
    ingresosTotales: 0,
    gastosTotales: 0,
    flujoNeto: 0,
    ingresosRenta: 0,
    ingresosDeposito: 0,
    ingresosOtros: 0,
    gastosMantenimiento: 0,
    gastosImpuestos: 0,
    gastosSeguros: 0,
    gastosServicios: 0,
    gastosOtros: 0,
  };

  transactions.forEach((t) => {
    if (t.tipo === 'ingreso') {
      summary.ingresosTotales += t.monto;
      if (t.categoria === 'ingreso_renta') summary.ingresosRenta += t.monto;
      else if (t.categoria === 'ingreso_deposito') summary.ingresosDeposito += t.monto;
      else summary.ingresosOtros += t.monto;
    } else {
      summary.gastosTotales += t.monto;
      if (t.categoria === 'gasto_mantenimiento') summary.gastosMantenimiento += t.monto;
      else if (t.categoria === 'gasto_impuesto') summary.gastosImpuestos += t.monto;
      else if (t.categoria === 'gasto_seguro') summary.gastosSeguros += t.monto;
      else if (t.categoria === 'gasto_servicio') summary.gastosServicios += t.monto;
      else summary.gastosOtros += t.monto;
    }
  });

  summary.flujoNeto = summary.ingresosTotales - summary.gastosTotales;

  return summary;
}

export async function generateCashFlowStatement(
  companyId: string,
  periodo: string
): Promise<void> {
  const [year, month] = periodo.split('-').map(Number);
  const fechaInicio = startOfMonth(new Date(year, month - 1));
  const fechaFin = endOfMonth(new Date(year, month - 1));

  const summary = await calculateCashFlow(companyId, fechaInicio, fechaFin);

  // Obtener saldo del mes anterior
  const previousMonth = format(subMonths(fechaInicio, 1), 'yyyy-MM');
  const previousStatement = await prisma.cashFlowStatement.findFirst({
    where: { companyId, periodo: previousMonth },
    orderBy: { createdAt: 'desc' },
  });

  const saldoInicial = previousStatement?.saldoFinal || 0;
  const saldoFinal = saldoInicial + summary.flujoNeto;

  // Crear o actualizar el statement
  const existing = await prisma.cashFlowStatement.findFirst({
    where: { companyId, periodo },
  });

  if (existing) {
    await prisma.cashFlowStatement.update({
      where: { id: existing.id },
      data: {
        ...summary,
        saldoInicial,
        saldoFinal,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.cashFlowStatement.create({
      data: {
        companyId,
        periodo,
        fechaInicio,
        fechaFin,
        ...summary,
        saldoInicial,
        saldoFinal,
      },
    });
  }
}

export async function syncPaymentsToAccounting(companyId: string): Promise<number> {
  // Sincronizar pagos pagados que no están en contabilidad
  const paidPayments = await prisma.payment.findMany({
    where: {
      estado: 'pagado',
      contract: {
        tenant: {
          companyId,
        },
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
          tenant: true,
        },
      },
    },
  });

  let syncedCount = 0;

  for (const payment of paidPayments) {
    // Verificar si ya existe en contabilidad
    const existing = await prisma.accountingTransaction.findFirst({
      where: {
        paymentId: payment.id,
      },
    });

    if (!existing && payment.fechaPago) {
      await prisma.accountingTransaction.create({
        data: {
          companyId,
          buildingId: payment.contract.unit.buildingId,
          unitId: payment.contract.unitId,
          tipo: 'ingreso',
          categoria: 'ingreso_renta',
          concepto: `Pago de renta - ${payment.contract.tenant.nombreCompleto} - ${payment.periodo}`,
          monto: payment.monto,
          fecha: payment.fechaPago,
          referencia: payment.id,
          paymentId: payment.id,
        },
      });
      syncedCount++;
    }
  }

  return syncedCount;
}

export async function syncExpensesToAccounting(companyId: string): Promise<number> {
  // Sincronizar gastos aprobados que no están en contabilidad
  const approvedExpenses = await prisma.expense.findMany({
    where: {
      OR: [
        { requiereAprobacion: false },
        { estadoAprobacion: 'aprobado' },
      ],
      building: {
        companyId,
      },
    },
    include: {
      building: true,
      unit: true,
    },
  });

  let syncedCount = 0;

  for (const expense of approvedExpenses) {
    // Verificar si ya existe en contabilidad
    const existing = await prisma.accountingTransaction.findFirst({
      where: {
        expenseId: expense.id,
      },
    });

    if (!existing) {
      // Mapear categoría de gasto
      let categoria: any = 'gasto_otro';
      if (expense.categoria === 'mantenimiento') categoria = 'gasto_mantenimiento';
      else if (expense.categoria === 'impuestos') categoria = 'gasto_impuesto';
      else if (expense.categoria === 'seguros') categoria = 'gasto_seguro';
      else if (expense.categoria === 'servicios') categoria = 'gasto_servicio';
      else if (expense.categoria === 'reparaciones') categoria = 'gasto_mantenimiento';
      else if (expense.categoria === 'comunidad') categoria = 'gasto_comunidad';

      await prisma.accountingTransaction.create({
        data: {
          companyId,
          buildingId: expense.buildingId || undefined,
          unitId: expense.unitId || undefined,
          tipo: 'gasto',
          categoria,
          concepto: expense.concepto,
          monto: expense.monto,
          fecha: expense.fecha,
          referencia: expense.id,
          expenseId: expense.id,
        },
      });
      syncedCount++;
    }
  }

  return syncedCount;
}

export async function getBalanceSheet(companyId: string, fecha: Date) {
  const transactions = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: {
        lte: fecha,
      },
    },
  });

  let totalIngresos = 0;
  let totalGastos = 0;

  transactions.forEach((t) => {
    if (t.tipo === 'ingreso') totalIngresos += t.monto;
    else totalGastos += t.monto;
  });

  const patrimonio = totalIngresos - totalGastos;

  return {
    totalIngresos,
    totalGastos,
    patrimonio,
    fecha,
  };
}

export async function getCenterOfCostsReport(companyId: string, periodo: string) {
  const [year, month] = periodo.split('-').map(Number);
  const fechaInicio = startOfMonth(new Date(year, month - 1));
  const fechaFin = endOfMonth(new Date(year, month - 1));

  // Obtener transacciones agrupadas por edificio
  const buildings = await prisma.building.findMany({
    where: { companyId },
    include: {
      units: true,
    },
  });

  const report: Array<{
    buildingId: string;
    nombreEdificio: string;
    totalUnidades: number;
    ingresos: number;
    gastos: number;
    utilidad: number;
    margen: number;
  }> = [];

  for (const building of buildings) {
    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        buildingId: building.id,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    });

    let ingresos = 0;
    let gastos = 0;

    transactions.forEach((t) => {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else gastos += t.monto;
    });

    report.push({
      buildingId: building.id,
      nombreEdificio: building.nombre,
      totalUnidades: building.units.length,
      ingresos,
      gastos,
      utilidad: ingresos - gastos,
      margen: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0,
    });
  }

  return report;
}

// ============================================
// CONTABILIDAD ANALÍTICA AVANZADA
// ============================================

export interface AnalyticalAccount {
  categoria: string;
  subcategoria?: string;
  montoTotal: number;
  porcentaje: number;
  desglose: {
    buildingId?: string;
    nombreEdificio?: string;
    unitId?: string;
    numeroUnidad?: string;
    monto: number;
  }[];
}

export async function getAnalyticalAccounting(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<AnalyticalAccount[]> {
  // Obtener todas las transacciones del período
  const transactions = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
  });

  // Agrupar por categorías
  const categorizedData: Record<string, AnalyticalAccount> = {};

  transactions.forEach((transaction) => {
    const categoria = transaction.categoria || 'sin_categoria';
    if (!categorizedData[categoria]) {
      categorizedData[categoria] = {
        categoria,
        montoTotal: 0,
        porcentaje: 0,
        desglose: [],
      };
    }

    const monto = transaction.tipo === 'ingreso' ? transaction.monto : -transaction.monto;
    categorizedData[categoria].montoTotal += monto;
    categorizedData[categoria].desglose.push({
      buildingId: transaction.buildingId || undefined,
      nombreEdificio: undefined,
      unitId: transaction.unitId || undefined,
      numeroUnidad: undefined,
      monto: transaction.monto,
    });
  });

  // Calcular totales y porcentajes
  const total = Object.values(categorizedData).reduce(
    (sum, cat) => sum + Math.abs(cat.montoTotal),
    0
  );

  const result = Object.values(categorizedData).map((cat) => ({
    ...cat,
    porcentaje: total > 0 ? (Math.abs(cat.montoTotal) / total) * 100 : 0,
  }));

  return result.sort((a, b) => Math.abs(b.montoTotal) - Math.abs(a.montoTotal));
}

// ============================================
// INFORMACIÓN FISCAL COMPLETA
// ============================================

export interface TaxSummary {
  periodo: string;
  ingresosTotales: number;
  gastosTotales: number;
  baseImponible: number;
  iva: {
    repercutido: number; // IVA en facturas emitidas
    soportado: number; // IVA en facturas recibidas
    aPagar: number; // Diferencia a pagar/devolver
  };
  irpf: {
    retenido: number;
    tipo: number;
  };
  beneficioAntesImpuestos: number;
  impuestoSociedadesEstimado: number;
  beneficioNeto: number;
}

export async function getTaxSummary(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<TaxSummary> {
  // Obtener transacciones del período
  const transactions = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
  });

  let ingresosTotales = 0;
  let gastosTotales = 0;

  transactions.forEach((t) => {
    if (t.tipo === 'ingreso') {
      ingresosTotales += t.monto;
    } else {
      gastosTotales += t.monto;
    }
  });

  // Cálculos fiscales (valores típicos en España)
  const baseImponible = ingresosTotales - gastosTotales;
  const tipoIVA = 0.21; // 21% IVA estándar
  const tipoIRPF = 0.19; // 19% IRPF para alquileres residenciales
  const tipoSociedades = 0.25; // 25% Impuesto de Sociedades

  // IVA
  const ivaRepercutido = ingresosTotales * tipoIVA;
  const ivaSoportado = gastosTotales * tipoIVA;
  const ivaAPagar = Math.max(0, ivaRepercutido - ivaSoportado);

  // IRPF (retención sobre alquileres)
  const irpfRetenido = ingresosTotales * tipoIRPF;

  // Impuesto de Sociedades
  const beneficioAntesImpuestos = baseImponible;
  const impuestoSociedadesEstimado = Math.max(0, beneficioAntesImpuestos * tipoSociedades);
  const beneficioNeto = beneficioAntesImpuestos - impuestoSociedadesEstimado;

  return {
    periodo: `${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')}`,
    ingresosTotales,
    gastosTotales,
    baseImponible,
    iva: {
      repercutido: ivaRepercutido,
      soportado: ivaSoportado,
      aPagar: ivaAPagar,
    },
    irpf: {
      retenido: irpfRetenido,
      tipo: tipoIRPF * 100,
    },
    beneficioAntesImpuestos,
    impuestoSociedadesEstimado,
    beneficioNeto,
  };
}

// ============================================
// CUENTA DE PÉRDIDAS Y GANANCIAS
// ============================================

export interface ProfitLossStatement {
  periodo: string;
  ingresos: {
    alquileres: number;
    servicios: number;
    otros: number;
    total: number;
  };
  gastos: {
    mantenimiento: number;
    servicios: number;
    seguros: number;
    impuestos: number;
    administracion: number;
    marketing: number;
    otros: number;
    total: number;
  };
  beneficioBruto: number;
  gastosOperativos: number;
  beneficioOperativo: number;
  gastosFinancieros: number;
  beneficioAntesImpuestos: number;
  impuestos: number;
  beneficioNeto: number;
  ebitda: number;
  margenes: {
    bruto: number;
    operativo: number;
    neto: number;
  };
}

export async function getProfitLossStatement(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<ProfitLossStatement> {
  // Obtener transacciones del período
  const transactions = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
  });

  // Clasificar ingresos
  let ingresosAlquileres = 0;
  let ingresosServicios = 0;
  let ingresosOtros = 0;

  // Clasificar gastos
  let gastosMantenimiento = 0;
  let gastosServicios = 0;
  let gastosSeguros = 0;
  let gastosImpuestos = 0;
  let gastosAdministracion = 0;
  let gastosMarketing = 0;
  let gastosOtros = 0;

  transactions.forEach((t) => {
    if (t.tipo === 'ingreso') {
      if (t.categoria === 'ingreso_renta') ingresosAlquileres += t.monto;
      else if (t.categoria === 'ingreso_deposito') ingresosServicios += t.monto;
      else ingresosOtros += t.monto;
    } else {
      if (t.categoria === 'gasto_mantenimiento') gastosMantenimiento += t.monto;
      else if (t.categoria === 'gasto_servicio') gastosServicios += t.monto;
      else if (t.categoria === 'gasto_seguro') gastosSeguros += t.monto;
      else if (t.categoria === 'gasto_impuesto') gastosImpuestos += t.monto;
      else if (t.categoria === 'gasto_administracion') gastosAdministracion += t.monto;
      else if (t.categoria === 'gasto_otro') gastosMarketing += t.monto;
      else gastosOtros += t.monto;
    }
  });

  const ingresosTotal = ingresosAlquileres + ingresosServicios + ingresosOtros;
  const gastosTotal =
    gastosMantenimiento +
    gastosServicios +
    gastosSeguros +
    gastosImpuestos +
    gastosAdministracion +
    gastosMarketing +
    gastosOtros;

  const beneficioBruto = ingresosTotal - (gastosMantenimiento + gastosServicios);
  const gastosOperativos = gastosSeguros + gastosImpuestos + gastosAdministracion + gastosMarketing;
  const beneficioOperativo = beneficioBruto - gastosOperativos;
  const gastosFinancieros = 0; // Placeholder
  const beneficioAntesImpuestos = beneficioOperativo - gastosFinancieros;
  const impuestos = Math.max(0, beneficioAntesImpuestos * 0.25);
  const beneficioNeto = beneficioAntesImpuestos - impuestos;
  const ebitda = beneficioOperativo;

  return {
    periodo: `${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')}`,
    ingresos: {
      alquileres: ingresosAlquileres,
      servicios: ingresosServicios,
      otros: ingresosOtros,
      total: ingresosTotal,
    },
    gastos: {
      mantenimiento: gastosMantenimiento,
      servicios: gastosServicios,
      seguros: gastosSeguros,
      impuestos: gastosImpuestos,
      administracion: gastosAdministracion,
      marketing: gastosMarketing,
      otros: gastosOtros,
      total: gastosTotal,
    },
    beneficioBruto,
    gastosOperativos,
    beneficioOperativo,
    gastosFinancieros,
    beneficioAntesImpuestos,
    impuestos,
    beneficioNeto,
    ebitda,
    margenes: {
      bruto: ingresosTotal > 0 ? (beneficioBruto / ingresosTotal) * 100 : 0,
      operativo: ingresosTotal > 0 ? (beneficioOperativo / ingresosTotal) * 100 : 0,
      neto: ingresosTotal > 0 ? (beneficioNeto / ingresosTotal) * 100 : 0,
    },
  };
}

// ============================================
// RATIOS FINANCIEROS
// ============================================

export interface FinancialRatios {
  rentabilidad: {
    roi: number; // Return on Investment
    roe: number; // Return on Equity
    roa: number; // Return on Assets
  };
  liquidez: {
    razonCorriente: number;
    pruebaAcida: number;
  };
  endeudamiento: {
    ratioEndeudamiento: number;
    cobertura: number;
  };
  eficiencia: {
    rotacionActivos: number;
    margenBruto: number;
    margenNeto: number;
  };
}

export async function calculateFinancialRatios(
  companyId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<FinancialRatios> {
  const profitLoss = await getProfitLossStatement(companyId, fechaInicio, fechaFin);
  const balance = await getBalanceSheet(companyId, fechaFin);

  // Valores placeholder - en producción se calcularían con datos reales
  const activoTotal = Math.abs(balance.patrimonio);
  const patrimonio = balance.patrimonio;
  const pasivo = 0; // Placeholder
  const activoCorriente = activoTotal * 0.3;
  const pasivoCorriente = pasivo * 0.5;

  return {
    rentabilidad: {
      roi: patrimonio > 0 ? (profitLoss.beneficioNeto / patrimonio) * 100 : 0,
      roe: patrimonio > 0 ? (profitLoss.beneficioNeto / patrimonio) * 100 : 0,
      roa: activoTotal > 0 ? (profitLoss.beneficioNeto / activoTotal) * 100 : 0,
    },
    liquidez: {
      razonCorriente: pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : 0,
      pruebaAcida: pasivoCorriente > 0 ? (activoCorriente * 0.8) / pasivoCorriente : 0,
    },
    endeudamiento: {
      ratioEndeudamiento: activoTotal > 0 ? pasivo / activoTotal : 0,
      cobertura:
        pasivo > 0
          ? (profitLoss.beneficioOperativo + profitLoss.gastosFinancieros) /
            profitLoss.gastosFinancieros
          : 0,
    },
    eficiencia: {
      rotacionActivos: activoTotal > 0 ? profitLoss.ingresos.total / activoTotal : 0,
      margenBruto: profitLoss.margenes.bruto,
      margenNeto: profitLoss.margenes.neto,
    },
  };
}
