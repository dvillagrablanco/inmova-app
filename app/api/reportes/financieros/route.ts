import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import type { Prisma } from '@/types/prisma-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener reportes financieros
type Period = 'month' | 'quarter' | 'year';

interface FinancialPropertyStats {
  id: string;
  nombre: string;
  ingresos: number;
  gastos: number;
  ocupacion: number;
  rentabilidad: number;
}

interface FinancialReport {
  ingresos: number;
  gastos: number;
  beneficio: number;
  ocupacion: number;
  morosidad: number;
  rentabilidad: number;
  ingresosChange: number;
  gastosChange: number;
  propiedades: FinancialPropertyStats[];
}

const periodSchema = z.enum(['month', 'quarter', 'year']);

async function getPeriodRange(period: Period) {
  const prisma = await getPrisma();
  const now = new Date();
  let start: Date;

  switch (period) {
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const end = now;
  const durationMs = Math.max(0, end.getTime() - start.getTime());
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return { start, end, previousStart, previousEnd };
}

async function roundTo(value: number, decimals: number) {
  const prisma = await getPrisma();
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function getErrorMessage(error: unknown) {
  const prisma = await getPrisma();
  return error instanceof Error ? error.message : 'Error desconocido';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedPeriod = periodSchema.safeParse(searchParams.get('period'));
    const period: Period = parsedPeriod.success ? parsedPeriod.data : 'month';
    const { start, end, previousStart, previousEnd } = getPeriodRange(period);
    const prisma = getPrismaClient();
    const companyId = session.user.companyId;

    const paymentBaseWhere: Prisma.PaymentWhereInput = {
      isDemo: false,
      contract: {
        isDemo: false,
        unit: {
          isDemo: false,
          building: { companyId, isDemo: false },
        },
      },
    };

    const expenseWhere: Prisma.ExpenseWhereInput = {
      isDemo: false,
      fecha: { gte: start, lte: end },
      OR: [
        { building: { companyId, isDemo: false } },
        { unit: { isDemo: false, building: { companyId, isDemo: false } } },
      ],
    };

    const previousExpenseWhere: Prisma.ExpenseWhereInput = {
      ...expenseWhere,
      fecha: { gte: previousStart, lte: previousEnd },
    };

    const [buildings, paidPayments, expenses, previousPaidPayments, previousExpenses, duePayments] =
      await Promise.all([
        prisma.building.findMany({
          where: { companyId, isDemo: false },
          select: {
            id: true,
            nombre: true,
            direccion: true,
            units: {
              where: { isDemo: false },
              select: { id: true, estado: true },
            },
          },
        }),
        prisma.payment.findMany({
          where: {
            ...paymentBaseWhere,
            estado: 'pagado',
            fechaPago: { gte: start, lte: end },
          },
          select: {
            monto: true,
            contract: {
              select: {
                unit: { select: { buildingId: true } },
              },
            },
          },
        }),
        prisma.expense.findMany({
          where: expenseWhere,
          select: {
            monto: true,
            buildingId: true,
            unit: { select: { buildingId: true } },
          },
        }),
        prisma.payment.findMany({
          where: {
            ...paymentBaseWhere,
            estado: 'pagado',
            fechaPago: { gte: previousStart, lte: previousEnd },
          },
          select: { monto: true },
        }),
        prisma.expense.findMany({
          where: previousExpenseWhere,
          select: { monto: true },
        }),
        prisma.payment.findMany({
          where: {
            ...paymentBaseWhere,
            fechaVencimiento: { gte: start, lte: end },
          },
          select: { monto: true, estado: true },
        }),
      ]);

    const ingresos = paidPayments.reduce((sum, payment) => sum + payment.monto, 0);
    const gastos = expenses.reduce((sum, expense) => sum + expense.monto, 0);
    const beneficio = ingresos - gastos;

    const totalUnidades = buildings.reduce((sum, building) => sum + building.units.length, 0);
    const unidadesOcupadas = buildings.reduce(
      (sum, building) => sum + building.units.filter((unit) => unit.estado === 'ocupada').length,
      0
    );
    const ocupacion = totalUnidades > 0 ? roundTo((unidadesOcupadas / totalUnidades) * 100, 1) : 0;

    const totalDue = duePayments.reduce((sum, payment) => sum + payment.monto, 0);
    const overdueAmount = duePayments
      .filter((payment) => payment.estado === 'atrasado')
      .reduce((sum, payment) => sum + payment.monto, 0);
    const morosidad = totalDue > 0 ? roundTo((overdueAmount / totalDue) * 100, 1) : 0;
    const rentabilidad = ingresos > 0 ? roundTo((beneficio / ingresos) * 100, 1) : 0;

    const ingresosPrevios = previousPaidPayments.reduce((sum, payment) => sum + payment.monto, 0);
    const gastosPrevios = previousExpenses.reduce((sum, expense) => sum + expense.monto, 0);
    const ingresosChange =
      ingresosPrevios > 0 ? roundTo(((ingresos - ingresosPrevios) / ingresosPrevios) * 100, 1) : 0;
    const gastosChange =
      gastosPrevios > 0 ? roundTo(((gastos - gastosPrevios) / gastosPrevios) * 100, 1) : 0;

    const ingresosPorBuilding = new Map<string, number>();
    for (const payment of paidPayments) {
      const buildingId = payment.contract.unit?.buildingId;
      if (!buildingId) continue;
      ingresosPorBuilding.set(buildingId, (ingresosPorBuilding.get(buildingId) ?? 0) + payment.monto);
    }

    const gastosPorBuilding = new Map<string, number>();
    for (const expense of expenses) {
      const buildingId = expense.buildingId ?? expense.unit?.buildingId;
      if (!buildingId) continue;
      gastosPorBuilding.set(buildingId, (gastosPorBuilding.get(buildingId) ?? 0) + expense.monto);
    }

    const propiedades: FinancialPropertyStats[] = buildings.map((building) => {
      const ingresosProp = ingresosPorBuilding.get(building.id) ?? 0;
      const gastosProp = gastosPorBuilding.get(building.id) ?? 0;
      const beneficioProp = ingresosProp - gastosProp;
      const ocupacionProp =
        building.units.length > 0
          ? roundTo(
              (building.units.filter((unit) => unit.estado === 'ocupada').length / building.units.length) *
                100,
              1
            )
          : 0;

      return {
        id: building.id,
        nombre: building.nombre || building.direccion,
        ingresos: ingresosProp,
        gastos: gastosProp,
        ocupacion: ocupacionProp,
        rentabilidad: ingresosProp > 0 ? roundTo((beneficioProp / ingresosProp) * 100, 1) : 0,
      };
    });

    const financialData: FinancialReport = {
      ingresos,
      gastos,
      beneficio,
      ocupacion,
      morosidad,
      rentabilidad,
      ingresosChange,
      gastosChange,
      propiedades,
    };

    return NextResponse.json({
      success: true,
      data: financialData,
      period,
    });
  } catch (error: unknown) {
    logger.error('[API Reportes Financieros] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reporte financiero', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
