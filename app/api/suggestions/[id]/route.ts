import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


const updateSuggestionSchema = z.object({
  estado: z.enum(['pendiente', 'en_revision', 'resuelta', 'rechazada']).optional(),
  respuesta: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica']).optional(),
});

// GET - Obtener una sugerencia específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Sugerencia no encontrada' },
        { status: 404 }
      );
    }

    // Solo super_admin o el usuario que creó la sugerencia pueden verla
    if (
      user.role !== 'super_admin' &&
      suggestion.userId !== user.id
    ) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta sugerencia' },
        { status: 403 }
      );
    }

    return NextResponse.json(suggestion);
  } catch (error: any) {
    logger.error('Error al obtener sugerencia:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener sugerencia' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una sugerencia (solo super_admin o soporte)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const body = await request.json();

    // Solo super_admin puede actualizar sugerencias
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar sugerencias' },
        { status: 403 }
      );
    }

    const validatedData = updateSuggestionSchema.parse(body);

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Sugerencia no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = { ...validatedData };

    // Si se proporciona respuesta, actualizar campos relacionados
    if (validatedData.respuesta) {
      updateData.respondidoPor = user.id;
      updateData.fechaRespuesta = new Date();
    }

    const updatedSuggestion = await prisma.suggestion.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            nombre: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notificar al usuario si se responde su sugerencia
    if (validatedData.respuesta && updatedSuggestion.userId) {
      await prisma.notification.create({
        data: {
          companyId: updatedSuggestion.companyId,
          userId: updatedSuggestion.userId,
          tipo: 'info',
          titulo: '✅ Respuesta a tu sugerencia',
          mensaje: `Tu sugerencia "${updatedSuggestion.titulo}" ha recibido una respuesta`,
          leida: false,
          entityId: id,
          entityType: 'suggestion',
        },
      });
    }

    return NextResponse.json(updatedSuggestion);
  } catch (error: any) {
    logger.error('Error al actualizar sugerencia:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al actualizar sugerencia' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una sugerencia (solo super_admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    // Solo super_admin puede eliminar sugerencias
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar sugerencias' },
        { status: 403 }
      );
    }

    await prisma.suggestion.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sugerencia eliminada correctamente' });
  } catch (error: any) {
    logger.error('Error al eliminar sugerencia:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar sugerencia' },
      { status: 500 }
    );
  }
}
