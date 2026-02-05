import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

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
            companyId,
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
              companyId,
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
              companyId,
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
              companyId,
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

    // Gastos del mes (modelo Expense)
    const expenses = await prisma.expense.findMany({
      where: {
        building: {
          companyId,
        },
        fecha: {
          gte: monthStart,
          lte: monthEnd,
        },
        isDemo: false,
      },
      select: { monto: true },
    });
    const monthlyExpenses = expenses.reduce((sum, e) => sum + (e.monto || 0), 0);

    // Contabilidad importada (solo no vinculada a pago/gasto)
    const accountingTransactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        fecha: { gte: monthStart, lte: monthEnd },
        paymentId: null,
        expenseId: null,
      },
      select: {
        tipo: true,
        monto: true,
      },
    });

    const accountingIncome = accountingTransactions
      .filter((tx) => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + (tx.monto || 0), 0);
    const accountingExpenses = accountingTransactions
      .filter((tx) => tx.tipo === 'gasto')
      .reduce((sum, tx) => sum + (tx.monto || 0), 0);

    const lastMonthAccounting = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        fecha: { gte: lastMonthStart, lte: lastMonthEnd },
        paymentId: null,
        expenseId: null,
      },
      select: { tipo: true, monto: true },
    });
    const lastMonthAccountingIncome = lastMonthAccounting
      .filter((tx) => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + (tx.monto || 0), 0);

    // Calcular estadísticas
    const monthlyIncome = currentMonthPayments
      .filter((p) => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    const lastMonthIncome =
      lastMonthPayments.reduce((sum, p) => sum + p.monto, 0) + lastMonthAccountingIncome;

    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.monto, 0);
    const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.monto, 0);

    const totalMonthlyIncome = monthlyIncome + accountingIncome;
    const totalMonthlyExpenses = monthlyExpenses + accountingExpenses;

    // Calcular saldo total estimado (rentas esperadas de contratos activos)
    const expectedMonthlyRent = activeContracts.reduce((sum, c) => sum + c.rentaMensual, 0);

    // Tasa de conciliación (pagos recibidos vs esperados)
    const reconciliationRate =
      expectedMonthlyRent > 0 ? Math.round((totalMonthlyIncome / expectedMonthlyRent) * 100) : 0;

    // Contar integraciones bancarias conectadas
    const bankConnections = await prisma.bankConnection
      .count({
        where: {
          companyId,
          estado: 'conectado',
        },
      })
      .catch(() => 0);

    const pendingReconciliation = await prisma.bankTransaction
      .count({
        where: {
          companyId,
          estado: 'pendiente_revision',
        },
      })
      .catch(() => 0);

    // Contar facturas del mes
    const monthlyInvoices = await (prisma as any).invoice
      ?.count({
        where: {
          companyId,
          fechaEmision: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })
      .catch(() => 0);

    // Calcular rentabilidad (si hay datos de propiedades)
    const rentabilidad =
      totalMonthlyIncome > 0
        ? ((totalMonthlyIncome - totalMonthlyExpenses) / totalMonthlyIncome) * 100
        : 0;

    const accountingIntegrations = await prisma.integrationConfig
      .count({
        where: { companyId, category: 'accounting', enabled: true },
      })
      .catch(() => 0);

    return NextResponse.json({
      summary: {
        totalBalance: totalMonthlyIncome - totalMonthlyExpenses,
        monthlyIncome: totalMonthlyIncome,
        monthlyExpenses: totalMonthlyExpenses,
        pendingPayments: totalPendingAmount,
        overduePayments: totalOverdueAmount,
        reconciliationRate: Math.min(reconciliationRate, 100),
      },
      moduleStats: {
        pendingReconciliation,
        bankConnections,
        pendingCollections: totalPendingAmount,
        monthlyInvoices: monthlyInvoices || 0,
        accountingIntegrations,
        rentabilidad: rentabilidad.toFixed(1),
      },
      comparison: {
        incomeChange:
          lastMonthIncome > 0
            ? Math.round(((totalMonthlyIncome - lastMonthIncome) / lastMonthIncome) * 100)
            : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching financial summary:', error);
    return NextResponse.json({ error: 'Error al obtener resumen financiero' }, { status: 500 });
  }
}
