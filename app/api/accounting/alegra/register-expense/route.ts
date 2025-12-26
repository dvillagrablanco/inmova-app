// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAlegraService } from '@/lib/alegra-integration-service';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = session.user;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const now = new Date();
    const expenses = await prisma.expense.findMany({
      where: {
        building: {
          companyId,
        },
        fecha: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      },
      include: {
        building: true,
      },
      take: 10,
    });

    const alegraService = getAlegraService();
    const results = [];

    for (const expense of expenses) {
      try {
        const registeredExpense = await alegraService.createExpense(expense);
        results.push({
          expenseId: expense.id,
          description: expense.concepto,
          success: true,
          amount: expense.monto,
          alegraExpenseId: registeredExpense.id,
        });
      } catch (error) {
        results.push({
          expenseId: expense.id,
          description: expense.concepto,
          success: false,
          error: 'Error al registrar gasto',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter((r) => r.success).length}/${results.length} gastos registrados en Alegra`,
      results,
    });
  } catch (error) {
    logger.error('Error registering expenses in Alegra:', error);
    return NextResponse.json({ error: 'Error al registrar gastos en Alegra' }, { status: 500 });
  }
}
