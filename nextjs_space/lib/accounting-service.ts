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

  const report = [];

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
