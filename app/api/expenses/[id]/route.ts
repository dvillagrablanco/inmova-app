/**
 * Endpoints API para operaciones específicas de Gastos
 *
 * Implementa operaciones GET, PUT y DELETE con validación Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { expenseUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/expenses/[id]
 * Obtiene un gasto específico con sus relaciones
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { nombre: true, id: true, companyId: true } },
        unit: {
          select: {
            numero: true,
            id: true,
            building: { select: { companyId: true } },
          },
        },
        provider: { select: { nombre: true, id: true, telefono: true, email: true } },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el gasto pertenece a la compañía del usuario
    const expenseCompanyId = expense.building?.companyId || expense.unit?.building?.companyId;

    if (expenseCompanyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este gasto' },
        { status: 403 }
      );
    }

    logger.info(`Gasto obtenido: ${expense.id}`, { userId: user.id });
    return NextResponse.json(expense, { status: 200 });
  } catch (error: any) {
    logger.error('Error fetching expense:', error);

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener gasto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expenses/[id]
 * Actualiza un gasto existente con validación Zod
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requirePermission('update');
    const body = await req.json();

    // Validación con Zod
    const validatedData = expenseUpdateSchema.parse(body);

    // Verificar que el gasto existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { companyId: true } },
        unit: {
          select: { building: { select: { companyId: true } } },
        },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const expenseCompanyId =
      existingExpense.building?.companyId || existingExpense.unit?.building?.companyId;

    if (expenseCompanyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este gasto' },
        { status: 403 }
      );
    }

    // Verificar edificio si se actualiza
    if (validatedData.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: validatedData.buildingId },
      });

      if (!building || building.companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a este edificio' },
          { status: 403 }
        );
      }
    }

    // Verificar unidad si se actualiza
    if (validatedData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: validatedData.unitId },
        include: { building: true },
      });

      if (!unit || unit.building.companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a esta unidad' },
          { status: 403 }
        );
      }
    }

    // Verificar proveedor si se actualiza
    if (validatedData.providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: validatedData.providerId },
      });

      if (!provider || provider.companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a este proveedor' },
          { status: 403 }
        );
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.fecha) {
      updateData.fecha = new Date(validatedData.fecha);
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: { select: { nombre: true, id: true } },
        unit: { select: { numero: true, id: true } },
        provider: { select: { nombre: true, id: true } },
      },
    });

    logger.info(`Gasto actualizado: ${expense.id}`, { userId: user.id, expenseId: expense.id });
    return NextResponse.json(expense, { status: 200 });
  } catch (error: any) {
    logger.error('Error updating expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json({ error: 'Prohibido', message: error.message }, { status: 403 });
    }

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al actualizar gasto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Elimina un gasto existente
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requirePermission('delete');

    // Verificar que el gasto existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        building: { select: { companyId: true } },
        unit: {
          select: { building: { select: { companyId: true } } },
        },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'No encontrado', message: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const expenseCompanyId =
      existingExpense.building?.companyId || existingExpense.unit?.building?.companyId;

    if (expenseCompanyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Prohibido', message: 'No tiene acceso a este gasto' },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    logger.info(`Gasto eliminado: ${params.id}`, { userId: user.id, expenseId: params.id });
    return NextResponse.json({ message: 'Gasto eliminado exitosamente' }, { status: 200 });
  } catch (error: any) {
    logger.error('Error deleting expense:', error);

    if (error.message?.includes('permiso')) {
      return NextResponse.json({ error: 'Prohibido', message: error.message }, { status: 403 });
    }

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}
