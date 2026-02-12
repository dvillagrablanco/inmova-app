import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
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
    // Compatibilidad: usar scope.companyIds para queries multi-empresa
    const companyId = scope.activeCompanyId;
    const companyIds = scope.companyIds;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Obtener contratos activos de la empresa
    const activeContracts = await prisma.contract.findMany({
      where: {
        unit: {
          building: {
            companyId: { in: companyIds },
          },
        },
        estado: 'activo',
        isDemo: false,
      },
      select: {
        id: true,
        rentaMensual: true,
      },
    });

    // Obtener pagos del mes actual
    const currentMonthPayments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId: { in: companyIds },
            },
          },
        },
        fechaPago: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        monto: true,
        estado: true,
      },
    });

    // Obtener pagos del mes anterior para comparación
    const lastMonthPayments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId: { in: companyIds },
            },
          },
        },
        fechaPago: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        monto: true,
      },
    });

    // Pagos pendientes
    const pendingPayments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: {
            building: {
              companyId: { in: companyIds },
            },
          },
        },
        estado: 'pendiente',
      },
      select: {
        monto: true,
        fechaVencimiento: true,
      },
    });

    // Pagos vencidos (pendientes con fecha pasada)
    const overduePayments = pendingPayments.filter((p) => new Date(p.fechaVencimiento) < now);

    // Calcular gastos del mes (si existe un modelo de Expense)
    let monthlyExpenses = 0;
    try {
      // Intentar obtener gastos si el modelo existe
      const expenses = await (prisma as any).expense?.findMany({
        where: {
          building: { companyId: { in: companyIds } },
          fecha: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          monto: true,
        },
      });
      if (expenses) {
        monthlyExpenses = expenses.reduce((sum: number, e: any) => sum + (e.monto || 0), 0);
      }
    } catch {
      // El modelo Expense no existe, usar 0
    }

    // Contabilidad agregada del mes (fallback)
    const accountingTransactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId: { in: companyIds },
        fecha: { gte: monthStart, lte: monthEnd },
      },
      select: {
        tipo: true,
        monto: true,
      },
    });

    const accountingTotals = accountingTransactions.reduce(
      (acc, transaction) => {
        if (transaction.tipo === 'ingreso') acc.ingresos += transaction.monto;
        else acc.gastos += transaction.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );

    // Calcular estadísticas
    let monthlyIncome = currentMonthPayments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    if (monthlyIncome === 0 && accountingTotals.ingresos > 0) {
      monthlyIncome = accountingTotals.ingresos;
    }

    if (monthlyExpenses === 0 && accountingTotals.gastos > 0) {
      monthlyExpenses = accountingTotals.gastos;
    }

    const lastMonthIncome = lastMonthPayments.reduce((sum, p) => sum + p.monto, 0);

    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.monto, 0);
    const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.monto, 0);

    // Calcular saldo total estimado (rentas esperadas de contratos activos)
    const expectedMonthlyRent = activeContracts.reduce((sum, c) => sum + c.rentaMensual, 0);

    // Tasa de conciliación (pagos recibidos vs esperados)
    const reconciliationRate =
      expectedMonthlyRent > 0 ? Math.round((monthlyIncome / expectedMonthlyRent) * 100) : 0;

    // Contar integraciones bancarias conectadas (por companyId directo, no por tenant)
    const bankConnections = await prisma.bankConnection
      .count({
        where: {
          companyId: { in: companyIds },
          estado: 'conectado',
        },
      })
      .catch(() => 0);

    // Contar facturas del mes
    const monthlyInvoices = await (prisma as any).invoice
      ?.count({
        where: {
          companyId: { in: companyIds },
          fechaEmision: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })
      .catch(() => 0);

    // Calcular rentabilidad real basada en ingresos anualizados vs renta mensual esperada
    let rentabilidad = 0;
    try {
      const properties = await prisma.unit.findMany({
        where: {
          building: {
            companyId: { in: companyIds },
            isDemo: false,
          },
          isDemo: false,
        },
        select: {
          rentaMensual: true,
        },
      });
      const totalRent = properties.reduce((sum, p) => sum + p.rentaMensual, 0);
      if (totalRent > 0 && monthlyIncome > 0) {
        // Rentabilidad anualizada: (ingresos mensuales * 12) / (renta esperada mensual * 12) * 100
        rentabilidad = (monthlyIncome / totalRent) * 100;
        // Cap between 0-100
        rentabilidad = Math.min(Math.max(rentabilidad, 0), 100);
      } else if (totalRent > 0) {
        // Si no hay ingresos del mes pero hay renta esperada, calcular usando contabilidad
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearlyIncome = await prisma.accountingTransaction.aggregate({
          where: {
            companyId: { in: companyIds },
            tipo: 'ingreso',
            fecha: { gte: yearStart, lte: now },
          },
          _sum: { monto: true },
        });
        const annualizedIncome = yearlyIncome._sum.monto || 0;
        const monthsElapsed = now.getMonth() + 1;
        const avgMonthlyIncome = annualizedIncome / monthsElapsed;
        if (avgMonthlyIncome > 0) {
          rentabilidad = (avgMonthlyIncome / totalRent) * 100;
          rentabilidad = Math.min(Math.max(rentabilidad, 0), 100);
        }
      }
    } catch {
      // Ignorar errores
    }

    // Estadísticas de movimientos bancarios (BankTransaction) para conciliación real
    let bankTxPending = 0;
    let bankTxTotal = 0;
    let bankTxIncome = 0;
    let bankTxExpense = 0;
    try {
      const [pendingTx, totalTx, bankIncome, bankExpense] = await Promise.all([
        prisma.bankTransaction.count({
          where: { companyId: { in: companyIds }, estado: 'pendiente_revision' },
        }),
        prisma.bankTransaction.count({
          where: { companyId: { in: companyIds } },
        }),
        prisma.bankTransaction.aggregate({
          where: {
            companyId: { in: companyIds },
            monto: { gt: 0 },
            fecha: { gte: monthStart, lte: monthEnd },
          },
          _sum: { monto: true },
        }),
        prisma.bankTransaction.aggregate({
          where: {
            companyId: { in: companyIds },
            monto: { lt: 0 },
            fecha: { gte: monthStart, lte: monthEnd },
          },
          _sum: { monto: true },
        }),
      ]);
      bankTxPending = pendingTx;
      bankTxTotal = totalTx;
      bankTxIncome = bankIncome._sum.monto || 0;
      bankTxExpense = Math.abs(bankExpense._sum.monto || 0);
    } catch {
      // BankTransaction puede no existir o no tener datos
    }

    // Si no hay ingresos de Payment ni AccountingTransaction, usar BankTransaction
    if (monthlyIncome === 0 && bankTxIncome > 0) {
      monthlyIncome = bankTxIncome;
    }
    if (monthlyExpenses === 0 && bankTxExpense > 0) {
      monthlyExpenses = bankTxExpense;
    }

    // Contar integraciones contables reales conectadas
    let accountingIntegrations = 0;
    try {
      // Contar si hay AccountingTransactions (indica integración contable)
      const hasAccounting = await prisma.accountingTransaction.count({
        where: { companyId: { in: companyIds } },
        take: 1,
      });
      if (hasAccounting > 0) accountingIntegrations++;
      // Contar si hay BankTransactions (indica integración bancaria)
      if (bankTxTotal > 0) accountingIntegrations++;
    } catch {
      accountingIntegrations = 0;
    }

    // Último período con datos contables
    let latestPeriod = null;
    try {
      const latest = await prisma.accountingTransaction.findFirst({
        where: { companyId: { in: companyIds } },
        orderBy: { fecha: 'desc' },
        select: { fecha: true },
      });

      if (latest?.fecha) {
        const latestStart = startOfMonth(latest.fecha);
        const latestEnd = endOfMonth(latest.fecha);
        const latestTransactions = await prisma.accountingTransaction.findMany({
          where: { companyId: { in: companyIds }, fecha: { gte: latestStart, lte: latestEnd } },
          select: { tipo: true, monto: true },
        });

        const latestTotals = latestTransactions.reduce(
          (acc, transaction) => {
            if (transaction.tipo === 'ingreso') acc.ingresos += transaction.monto;
            else acc.gastos += transaction.monto;
            return acc;
          },
          { ingresos: 0, gastos: 0 }
        );

        latestPeriod = {
          periodo: format(latestStart, 'yyyy-MM'),
          ingresos: latestTotals.ingresos,
          gastos: latestTotals.gastos,
          flujoNeto: latestTotals.ingresos - latestTotals.gastos,
          totalMovimientos: latestTransactions.length,
        };
      }
    } catch {
      latestPeriod = null;
    }

    // Tasa de conciliación bancaria real (si hay movimientos bancarios)
    let bankReconciliationRate = 0;
    if (bankTxTotal > 0) {
      const conciliadosTx = await prisma.bankTransaction
        .count({
          where: { companyId: { in: companyIds }, estado: 'conciliado' },
        })
        .catch(() => 0);
      bankReconciliationRate = Math.round((conciliadosTx / bankTxTotal) * 100);
    }

    // Usar tasa de conciliación bancaria si hay datos bancarios, sino la de pagos
    const effectiveReconciliationRate =
      bankTxTotal > 0 ? bankReconciliationRate : Math.min(reconciliationRate, 100);

    return NextResponse.json({
      summary: {
        totalBalance: monthlyIncome - monthlyExpenses,
        monthlyIncome,
        monthlyExpenses,
        pendingPayments: totalPendingAmount,
        overduePayments: totalOverdueAmount,
        reconciliationRate: effectiveReconciliationRate,
      },
      moduleStats: {
        pendingReconciliation: bankTxPending > 0 ? bankTxPending : pendingPayments.length,
        bankConnections,
        pendingCollections: totalPendingAmount,
        monthlyInvoices: monthlyInvoices || 0,
        accountingIntegrations,
        rentabilidad: rentabilidad.toFixed(1),
      },
      bankStats: {
        totalMovimientos: bankTxTotal,
        pendientes: bankTxPending,
        ingresosMes: bankTxIncome,
        gastosMes: bankTxExpense,
        tasaConciliacion: bankReconciliationRate,
      },
      latestPeriod,
      comparison: {
        incomeChange:
          lastMonthIncome > 0
            ? Math.round(((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100)
            : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching financial summary:', error);
    return NextResponse.json({ error: 'Error al obtener resumen financiero' }, { status: 500 });
  }
}
