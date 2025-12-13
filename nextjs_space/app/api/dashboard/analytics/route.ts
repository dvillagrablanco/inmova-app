import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    // Get payments for last 12 months
    const now = new Date();
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          unit: { building: { companyId } },
        },
        estado: 'pagado',
      },
    });

    // Get expenses for last 12 months
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { building: { companyId } },
          { unit: { building: { companyId } } },
        ],
      },
    });

    // Calculate monthly data for last 12 months
    const monthlyData: Array<{
      mes: string;
      ingresos: number;
      gastos: number;
      neto: number;
    }> = [];
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      // Calculate income for this month
      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.fechaVencimiento);
        return (
          paymentDate.getMonth() === month &&
          paymentDate.getFullYear() === year
        );
      });
      const ingresos = monthPayments.reduce((sum, p) => sum + p.monto, 0);

      // Calculate expenses for this month
      const monthExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.fecha);
        return (
          expenseDate.getMonth() === month &&
          expenseDate.getFullYear() === year
        );
      });
      const gastos = monthExpenses.reduce((sum, e) => sum + e.monto, 0);

      monthlyData.push({
        mes: monthNames[month],
        ingresos,
        gastos,
        neto: ingresos - gastos,
      });
    }

    return NextResponse.json({
      monthlyData,
      totalIngresos: payments.reduce((sum, p) => sum + p.monto, 0),
      totalGastos: expenses.reduce((sum, e) => sum + e.monto, 0),
    });
  } catch (error: any) {
    logger.error('Error fetching analytics:', error);
    if (error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
