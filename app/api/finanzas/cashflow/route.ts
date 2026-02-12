/**
 * API de Cash Flow (Flujo de Caja)
 *
 * Calcula el flujo de caja mensual combinando datos de:
 * - AccountingTransaction (contabilidad importada)
 * - BankTransaction (movimientos bancarios CAMT.053)
 * - Payment (pagos de contratos)
 *
 * Soporta filtrado por empresa (companyId) y rango de fechas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from 'date-fns';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    const companyIds = scope.companyIds;
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    const source = searchParams.get('source') || 'auto'; // 'accounting', 'bank', 'auto'

    const now = new Date();
    const startDate = startOfMonth(subMonths(now, months - 1));
    const endDate = endOfMonth(now);

    // Prepare monthly buckets
    const monthlyData: Array<{
      periodo: string;
      mes: string;
      ingresos: number;
      gastos: number;
      neto: number;
      saldoAcumulado: number;
      fuente: string;
    }> = [];

    // Fetch all data sources in parallel
    const [accountingTx, bankTx, payments] = await Promise.all([
      // AccountingTransaction data
      prisma.accountingTransaction.findMany({
        where: {
          companyId: { in: companyIds },
          fecha: { gte: startDate, lte: endDate },
        },
        select: { tipo: true, monto: true, fecha: true },
      }),
      // BankTransaction data
      prisma.bankTransaction.findMany({
        where: {
          companyId: { in: companyIds },
          fecha: { gte: startDate, lte: endDate },
        },
        select: { monto: true, fecha: true },
      }),
      // Payment data
      prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId: { in: companyIds } } } },
          fechaVencimiento: { gte: startDate, lte: endDate },
          estado: 'pagado',
        },
        select: { monto: true, fechaVencimiento: true },
      }),
    ]);

    // Aggregate by month
    let runningBalance = 0;
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(startDate, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);

      // Accounting data for this month
      let acctIngresos = 0,
        acctGastos = 0;
      for (const tx of accountingTx) {
        if (tx.fecha >= mStart && tx.fecha <= mEnd) {
          if (tx.tipo === 'ingreso') acctIngresos += tx.monto;
          else acctGastos += tx.monto;
        }
      }

      // Bank data for this month
      let bankIngresos = 0,
        bankGastos = 0;
      for (const tx of bankTx) {
        if (tx.fecha >= mStart && tx.fecha <= mEnd) {
          if (tx.monto > 0) bankIngresos += tx.monto;
          else bankGastos += Math.abs(tx.monto);
        }
      }

      // Payment data for this month
      let payIngresos = 0;
      for (const p of payments) {
        if (p.fechaVencimiento >= mStart && p.fechaVencimiento <= mEnd) {
          payIngresos += p.monto;
        }
      }

      // Select best data source
      let ingresos = 0,
        gastos = 0,
        fuente = 'sin_datos';

      if (source === 'bank' && (bankIngresos > 0 || bankGastos > 0)) {
        ingresos = bankIngresos;
        gastos = bankGastos;
        fuente = 'banco';
      } else if (source === 'accounting' && (acctIngresos > 0 || acctGastos > 0)) {
        ingresos = acctIngresos;
        gastos = acctGastos;
        fuente = 'contabilidad';
      } else {
        // Auto: prefer bank > accounting > payments
        if (bankIngresos > 0 || bankGastos > 0) {
          ingresos = bankIngresos;
          gastos = bankGastos;
          fuente = 'banco';
        } else if (acctIngresos > 0 || acctGastos > 0) {
          ingresos = acctIngresos;
          gastos = acctGastos;
          fuente = 'contabilidad';
        } else if (payIngresos > 0) {
          ingresos = payIngresos;
          fuente = 'pagos';
        }
      }

      const neto = ingresos - gastos;
      runningBalance += neto;

      monthlyData.push({
        periodo: format(monthDate, 'yyyy-MM'),
        mes: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
        ingresos: Math.round(ingresos * 100) / 100,
        gastos: Math.round(gastos * 100) / 100,
        neto: Math.round(neto * 100) / 100,
        saldoAcumulado: Math.round(runningBalance * 100) / 100,
        fuente,
      });
    }

    // Calculate totals
    const totals = monthlyData.reduce(
      (acc, m) => {
        acc.ingresos += m.ingresos;
        acc.gastos += m.gastos;
        acc.neto += m.neto;
        return acc;
      },
      { ingresos: 0, gastos: 0, neto: 0 }
    );

    // Data source summary
    const sources = {
      contabilidad: accountingTx.length,
      banco: bankTx.length,
      pagos: payments.length,
    };

    return NextResponse.json({
      data: monthlyData,
      totals: {
        ingresos: Math.round(totals.ingresos * 100) / 100,
        gastos: Math.round(totals.gastos * 100) / 100,
        neto: Math.round(totals.neto * 100) / 100,
      },
      sources,
      meta: {
        months,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        companyIds,
      },
    });
  } catch (error) {
    logger.error('Error en cashflow:', error);
    return NextResponse.json({ error: 'Error al calcular flujo de caja' }, { status: 500 });
  }
}
