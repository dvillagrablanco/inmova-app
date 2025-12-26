import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read (if from tenant)
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: 'tenant',
        leido: false,
      },
      data: {
        leido: true,
        estado: 'leido',
      },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    logger.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar mensajes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { conversationId, mensaje } = await request.json();

    if (!conversationId || !mensaje) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no válido' }, { status: 401 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: 'user',
        senderId: userId,
        mensaje,
      },
    });

    // Update conversation
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        ultimoMensaje: mensaje,
        ultimoMensajeFecha: new Date(),
      },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    logger.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
