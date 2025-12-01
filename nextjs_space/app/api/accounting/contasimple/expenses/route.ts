import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getContaSimpleService } from '@/lib/contasimple-integration-service';
import { prisma } from '@/lib/db';

/**
 * POST /api/accounting/contasimple/expenses
 * Registra un gasto de INMOVA en ContaSimple
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { expenseId } = body;

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Se requiere expenseId' },
        { status: 400 }
      );
    }

    // Obtener datos del gasto
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    if (
      !expense ||
      expense.unit?.building?.companyId !== session.user.companyId
    ) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    // Registrar gasto en ContaSimple
    const contaSimpleService = getContaSimpleService();
    const contaSimpleExpense = await contaSimpleService.syncExpenseToContaSimple(expense);

    // Guardar referencia del gasto
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        contasimpleExpenseId: contaSimpleExpense.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Gasto registrado exitosamente: ${expense.monto}€`,
      data: contaSimpleExpense,
    });
  } catch (error) {
    console.error('Error al registrar gasto en ContaSimple:', error);
    return NextResponse.json(
      { error: 'Error al registrar gasto' },
      { status: 500 }
    );
  }
}
