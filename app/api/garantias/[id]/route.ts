import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener una garantía específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deposit = await prisma.depositManagement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        contract: {
          include: {
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                telefono: true,
              },
            },
            unit: {
              select: {
                id: true,
                numero: true,
                building: {
                  select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Garantía no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deposit,
    });
  } catch (error: any) {
    console.error('[API Garantías GET ID] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener garantía', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar garantía (añadir deducción o procesar devolución)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Verificar que la garantía existe y pertenece a la empresa
    const deposit = await prisma.depositManagement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Garantía no encontrada' },
        { status: 404 }
      );
    }

    // Acción: añadir deducción
    if (action === 'add_deduction') {
      const deductionSchema = z.object({
        amount: z.number().positive('El importe debe ser positivo'),
        reason: z.string().min(1, 'El motivo es requerido'),
      });

      const validation = deductionSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { amount, reason } = validation.data;

      // Verificar que la deducción no exceda el importe disponible
      const disponible = deposit.importeFianza - deposit.deducciones;
      if (amount > disponible) {
        return NextResponse.json(
          { error: `La deducción excede el importe disponible (€${disponible.toFixed(2)})` },
          { status: 400 }
        );
      }

      // Actualizar deducciones
      const motivoActual = deposit.motivoDeducciones || '';
      const nuevoMotivo = motivoActual 
        ? `${motivoActual}\n[${new Date().toLocaleDateString('es-ES')}] €${amount}: ${reason}`
        : `[${new Date().toLocaleDateString('es-ES')}] €${amount}: ${reason}`;

      const updated = await prisma.depositManagement.update({
        where: { id: params.id },
        data: {
          deducciones: deposit.deducciones + amount,
          motivoDeducciones: nuevoMotivo,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Deducción añadida correctamente',
      });
    }

    // Acción: procesar devolución
    if (action === 'process_return') {
      if (deposit.devuelto) {
        return NextResponse.json(
          { error: 'Esta garantía ya ha sido devuelta' },
          { status: 400 }
        );
      }

      const returnSchema = z.object({
        returnAmount: z.number().optional(),
        returnDate: z.string().optional(),
        notes: z.string().optional(),
      });

      const validation = returnSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { returnAmount, returnDate, notes } = validation.data;
      const importeDevolver = returnAmount ?? (deposit.importeFianza - deposit.deducciones);

      const updated = await prisma.depositManagement.update({
        where: { id: params.id },
        data: {
          devuelto: true,
          importeDevuelto: importeDevolver,
          fechaDevolucion: returnDate ? new Date(returnDate) : new Date(),
          motivoDeducciones: notes 
            ? (deposit.motivoDeducciones ? `${deposit.motivoDeducciones}\n[Devolución] ${notes}` : `[Devolución] ${notes}`)
            : deposit.motivoDeducciones,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Devolución procesada: €${importeDevolver.toFixed(2)}`,
      });
    }

    // Acción: actualizar datos generales
    const updateSchema = z.object({
      entidadDeposito: z.string().optional(),
      numeroDeposito: z.string().optional(),
      depositadoOficialmente: z.boolean().optional(),
    });

    const validation = updateSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updated = await prisma.depositManagement.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Garantía actualizada correctamente',
    });
  } catch (error: any) {
    console.error('[API Garantías PUT] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar garantía', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar garantía
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la garantía existe y pertenece a la empresa
    const deposit = await prisma.depositManagement.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Garantía no encontrada' },
        { status: 404 }
      );
    }

    // No permitir eliminar si no está devuelta
    if (!deposit.devuelto) {
      return NextResponse.json(
        { error: 'No se puede eliminar una garantía que no ha sido devuelta' },
        { status: 400 }
      );
    }

    await prisma.depositManagement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Garantía eliminada correctamente',
    });
  } catch (error: any) {
    console.error('[API Garantías DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar garantía', details: error.message },
      { status: 500 }
    );
  }
}
