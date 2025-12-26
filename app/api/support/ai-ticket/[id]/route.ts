import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET: Obtener un ticket específico con todos sus mensajes
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    logger.error('Error al obtener ticket:', error);
    return NextResponse.json({ error: 'Error al obtener el ticket' }, { status: 500 });
  }
}

/**
 * POST: Agregar un nuevo mensaje al ticket
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }

    // Verificar que el ticket pertenece al usuario
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Crear el mensaje del usuario
    await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        sender: 'user',
        message,
        isAutomatic: false,
      },
    });

    // Si el ticket estaba resuelto, reabrirlo
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: {
          status: 'open',
          resolvedAt: null,
        },
      });
    }

    // Generar respuesta automática de IA
    const aiResponse = await generateFollowUpResponse(message, ticket);

    if (aiResponse) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: params.id,
          sender: 'ai',
          message: aiResponse.message,
          isAutomatic: true,
        },
      });

      // Si la IA puede resolver el ticket
      if (aiResponse.canResolve) {
        await prisma.supportTicket.update({
          where: { id: params.id },
          data: {
            status: 'resolved',
            autoResolved: true,
            resolvedAt: new Date(),
          },
        });
      }
    }

    // Obtener el ticket actualizado
    const updatedTicket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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

    logger.info('Mensaje agregado al ticket', {
      ticketId: params.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      ticket: updatedTicket,
      aiResponse,
    });
  } catch (error) {
    logger.error('Error al agregar mensaje al ticket:', error);
    return NextResponse.json({ error: 'Error al agregar el mensaje' }, { status: 500 });
  }
}

/**
 * PATCH: Actualizar el estado del ticket o calificarlo
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { status, rating, feedback } = await req.json();

    // Verificar que el ticket pertenece al usuario
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }

    if (rating !== undefined) {
      const existingTags =
        ticket.tags && typeof ticket.tags === 'object' ? (ticket.tags as Record<string, any>) : {};
      updateData.tags = {
        ...existingTags,
        rating,
        feedback,
      };
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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

    logger.info('Ticket actualizado', {
      ticketId: params.id,
      userId: session.user.id,
      status,
      rating,
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    logger.error('Error al actualizar ticket:', error);
    return NextResponse.json({ error: 'Error al actualizar el ticket' }, { status: 500 });
  }
}

/**
 * Genera una respuesta de seguimiento basada en el mensaje del usuario
 */
async function generateFollowUpResponse(
  message: string,
  ticket: any
): Promise<{ message: string; canResolve: boolean } | null> {
  const text = message.toLowerCase();

  // Respuestas de confirmación
  if (
    text.includes('gracias') ||
    text.includes('resuelto') ||
    text.includes('solucionado') ||
    text.includes('funciona')
  ) {
    return {
      message:
        '¡Me alegra saber que tu problema se ha resuelto! \n\n' +
        'Si tienes alguna otra pregunta o necesitas ayuda adicional, ' +
        'no dudes en abrir un nuevo ticket.\n\n' +
        '¿Te gustaría calificar la atención recibida? Tu feedback nos ayuda a mejorar.',
      canResolve: true,
    };
  }

  // Si el usuario proporciona más información
  if (text.length > 100) {
    return {
      message:
        'Gracias por proporcionar más detalles. He registrado esta información adicional.\n\n' +
        'Un administrador revisará tu caso y te responderá con una solución personalizada ' +
        'lo antes posible.\n\n' +
        'Tiempo estimado de respuesta: 24 horas.',
      canResolve: false,
    };
  }

  // Respuesta genérica para seguimientos
  return {
    message:
      'He registrado tu mensaje. Un miembro de nuestro equipo lo revisará ' +
      'y te responderá lo antes posible.\n\n' +
      'Mientras tanto, puedes consultar nuestra Base de Conocimientos o ' +
      'usar el asistente de IA para obtener ayuda inmediata.',
    canResolve: false,
  };
}
