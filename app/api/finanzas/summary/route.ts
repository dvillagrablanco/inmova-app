import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

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
      return NextResponse.json({
        error: 'Sin empresa asociada',
        debug: {
          userId: (session.user as any)?.id,
          companyId: (session.user as any)?.companyId,
          role: (session.user as any)?.role,
        },
      }, { status: 403 });
    }

    const companyIds = scope.companyIds;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // ================================================================
    // PASO 1: Buscar el último periodo con datos reales
    // ================================================================
    
    // Buscar en AccountingTransaction
    const latestAccounting = await prisma.accountingTransaction.findFirst({
      where: { companyId: { in: companyIds } },
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    });

    // Buscar en BankTransaction
    const latestBank = await prisma.bankTransaction.findFirst({
      where: { companyId: { in: companyIds } },
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    }).catch(() => null);

    // Determinar el periodo a mostrar: intentar mes actual, sino el último con datos
    let displayStart = monthStart;
    let displayEnd = monthEnd;
    let displayPeriodo = format(now, 'yyyy-MM');
    let isCurrentMonth = true;

    // Verificar si hay datos en el mes actual
    const currentMonthAccounting = await prisma.accountingTransaction.count({
      where: {
        companyId: { in: companyIds },
        fecha: { gte: monthStart, lte: monthEnd },
      },
    });
    const currentMonthBank = await prisma.bankTransaction.count({
      where: {
        companyId: { in: companyIds },
        fecha: { gte: monthStart, lte: monthEnd },
      },
    }).catch(() => 0);

    // Si no hay datos en el mes actual, usar el último periodo con datos
    if (currentMonthAccounting === 0 && currentMonthBank === 0) {
      const latestDate = [latestAccounting?.fecha, latestBank?.fecha]
        .filter(Boolean)
        .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];

      if (latestDate) {
        displayStart = startOfMonth(latestDate);
        displayEnd = endOfMonth(latestDate);
        displayPeriodo = format(latestDate, 'yyyy-MM');
        isCurrentMonth = false;
      }
    }

    // ================================================================
    // PASO 2: Obtener datos del periodo seleccionado
    // ================================================================

    // Contabilidad del periodo
    const accountingTransactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: companyIds },
        fecha: { gte: displayStart, lte: displayEnd },
      },
      select: { tipo: true, monto: true, categoria: true },
    });

    const accountingTotals = accountingTransactions.reduce(
      (acc, t) => {
        if (t.tipo === 'ingreso') acc.ingresos += t.monto;
        else acc.gastos += t.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );

    // Movimientos bancarios del periodo
    let bankTxIncome = 0;
    let bankTxExpense = 0;
    let bankTxPending = 0;
    let bankTxTotal = 0;
    try {
      const [bankInc, bankExp, pendingTx, totalTx] = await Promise.all([
        prisma.bankTransaction.aggregate({
          where: { companyId: { in: companyIds }, monto: { gt: 0 }, fecha: { gte: displayStart, lte: displayEnd } },
          _sum: { monto: true },
        }),
        prisma.bankTransaction.aggregate({
          where: { companyId: { in: companyIds }, monto: { lt: 0 }, fecha: { gte: displayStart, lte: displayEnd } },
          _sum: { monto: true },
        }),
        prisma.bankTransaction.count({
          where: { companyId: { in: companyIds }, estado: 'pendiente_revision' },
        }),
        prisma.bankTransaction.count({
          where: { companyId: { in: companyIds } },
        }),
      ]);
      bankTxIncome = bankInc._sum.monto || 0;
      bankTxExpense = Math.abs(bankExp._sum.monto || 0);
      bankTxPending = pendingTx;
      bankTxTotal = totalTx;
    } catch {
      // BankTransaction might not have data
    }

    // Pagos del periodo
    const payments = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId: { in: companyIds } } } },
        fechaPago: { gte: displayStart, lte: displayEnd },
        estado: 'pagado',
      },
      select: { monto: true },
    }).catch(() => [] as { monto: number }[]);

    const paymentIncome = payments.reduce((s, p) => s + p.monto, 0);

    // Pagos pendientes (sin filtro de fecha - totales)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: { unit: { building: { companyId: { in: companyIds } } } },
        estado: 'pendiente',
      },
      select: { monto: true, fechaVencimiento: true },
    }).catch(() => [] as { monto: number; fechaVencimiento: Date }[]);

    const overduePayments = pendingPayments.filter(p => new Date(p.fechaVencimiento) < now);
    const totalPendingAmount = pendingPayments.reduce((s, p) => s + p.monto, 0);
    const totalOverdueAmount = overduePayments.reduce((s, p) => s + p.monto, 0);

    // ================================================================
    // PASO 3: Calcular KPIs con cascada de fuentes
    // ================================================================

    // Ingresos: Payment > AccountingTransaction > BankTransaction
    let monthlyIncome = paymentIncome;
    if (monthlyIncome === 0) monthlyIncome = accountingTotals.ingresos;
    if (monthlyIncome === 0) monthlyIncome = bankTxIncome;

    // Gastos: Expense > AccountingTransaction > BankTransaction
    let monthlyExpenses = 0;
    try {
      const expenses = await prisma.expense.aggregate({
        where: {
          building: { companyId: { in: companyIds } },
          fecha: { gte: displayStart, lte: displayEnd },
        },
        _sum: { monto: true },
      });
      monthlyExpenses = expenses._sum.monto || 0;
    } catch { /* Expense model might not exist */ }
    if (monthlyExpenses === 0) monthlyExpenses = accountingTotals.gastos;
    if (monthlyExpenses === 0) monthlyExpenses = bankTxExpense;

    // Bank connections
    const bankConnections = await prisma.bankConnection.count({
      where: { companyId: { in: companyIds }, estado: 'conectado' },
    }).catch(() => 0);

    // Accounting integrations
    let accountingIntegrations = 0;
    if (accountingTransactions.length > 0) accountingIntegrations++;
    if (bankTxTotal > 0) accountingIntegrations++;

    // Rentabilidad
    let rentabilidad = 0;
    if (monthlyIncome > 0) {
      const totalRent = await prisma.unit.aggregate({
        where: { building: { companyId: { in: companyIds }, isDemo: false }, isDemo: false },
        _sum: { rentaMensual: true },
      }).catch(() => ({ _sum: { rentaMensual: 0 } }));
      const expectedRent = totalRent._sum.rentaMensual || 0;
      if (expectedRent > 0) {
        rentabilidad = Math.min((monthlyIncome / expectedRent) * 100, 100);
      }
    }

    // Reconciliation rate
    let reconciliationRate = 0;
    if (bankTxTotal > 0) {
      const conciliados = await prisma.bankTransaction.count({
        where: { companyId: { in: companyIds }, estado: 'conciliado' },
      }).catch(() => 0);
      reconciliationRate = Math.round((conciliados / bankTxTotal) * 100);
    }

    // ================================================================
    // PASO 4: Datos del último periodo vs periodo anterior (comparación)
    // ================================================================

    const prevStart = startOfMonth(subMonths(displayStart, 1));
    const prevEnd = endOfMonth(subMonths(displayStart, 1));

    const prevAccountingTx = await prisma.accountingTransaction.findMany({
      where: { companyId: { in: companyIds }, fecha: { gte: prevStart, lte: prevEnd } },
      select: { tipo: true, monto: true },
    });
    const prevIngresos = prevAccountingTx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);

    // Determinar fuente de datos principal
    let dataSource = 'sin_datos';
    if (paymentIncome > 0) dataSource = 'pagos';
    else if (accountingTotals.ingresos > 0 || accountingTotals.gastos > 0) dataSource = 'contabilidad';
    else if (bankTxIncome > 0 || bankTxExpense > 0) dataSource = 'banco';

    // Total de registros contables (para mostrar si hay datos)
    const totalAccountingRecords = await prisma.accountingTransaction.count({
      where: { companyId: { in: companyIds } },
    });

    return NextResponse.json({
      summary: {
        totalBalance: monthlyIncome - monthlyExpenses,
        monthlyIncome,
        monthlyExpenses,
        pendingPayments: totalPendingAmount,
        overduePayments: totalOverdueAmount,
        reconciliationRate,
      },
      moduleStats: {
        pendingReconciliation: bankTxPending > 0 ? bankTxPending : pendingPayments.length,
        bankConnections,
        pendingCollections: totalPendingAmount,
        monthlyInvoices: 0,
        accountingIntegrations,
        rentabilidad: rentabilidad.toFixed(1),
      },
      bankStats: {
        totalMovimientos: bankTxTotal,
        pendientes: bankTxPending,
        ingresosMes: bankTxIncome,
        gastosMes: bankTxExpense,
        tasaConciliacion: reconciliationRate,
      },
      latestPeriod: {
        periodo: displayPeriodo,
        isCurrentMonth,
        ingresos: monthlyIncome,
        gastos: monthlyExpenses,
        flujoNeto: monthlyIncome - monthlyExpenses,
        totalMovimientos: accountingTransactions.length + (bankTxTotal > 0 ? bankTxTotal : 0),
      },
      comparison: {
        incomeChange: prevIngresos > 0
          ? Math.round(((monthlyIncome - prevIngresos) / prevIngresos) * 100)
          : 0,
      },
      meta: {
        companyIds,
        activeCompanyId: scope.activeCompanyId,
        isConsolidated: scope.isConsolidated,
        displayPeriodo,
        isCurrentMonth,
        dataSource,
        totalAccountingRecords,
        totalBankRecords: bankTxTotal,
      },
    });
  } catch (error) {
    logger.error('Error fetching financial summary:', error);
    return NextResponse.json({
      error: 'Error al obtener resumen financiero',
      details: (error as any)?.message,
    }, { status: 500 });
  }
}
