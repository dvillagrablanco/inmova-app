import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Obtener mensajes entre dos usuarios
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const otherUserId = params.userId;

    // Verificar que el otro usuario existe y pertenece a la misma empresa
    const otherUser = await prisma.user.findFirst({
      where: {
        id: otherUserId,
        companyId: user.companyId
      },
      select: { id: true, name: true, email: true }
    });

    if (!otherUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener mensajes entre los dos usuarios
    const messages = await prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        tipo: 'info', // Mensajes de chat
        OR: [
          { userId: user.id, entityId: otherUserId },
          { userId: otherUserId, entityId: user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        titulo: true,
        mensaje: true,
        leida: true,
        userId: true,
        createdAt: true
      }
    });

    // Marcar como leídos los mensajes recibidos
    await prisma.notification.updateMany({
      where: {
        companyId: user.companyId,
        tipo: 'info',
        userId: user.id,
        entityId: otherUserId,
        leida: false
      },
      data: { leida: true }
    });

    return NextResponse.json({
      messages: messages.map(m => ({
        ...m,
        isSent: m.userId === otherUserId // Si el userId es el otro usuario, es mensaje enviado por él
      })),
      otherUser
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST - Enviar mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true, name: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const recipientId = params.userId;

    // Verificar que el destinatario existe
    const recipient = await prisma.user.findFirst({
      where: {
        id: recipientId,
        companyId: user.companyId
      }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Destinatario no encontrado' }, { status: 404 });
    }

    // Crear el mensaje como notificación
    const newMessage = await prisma.notification.create({
      data: {
        companyId: user.companyId,
        tipo: 'info', // Tipo para mensajes de chat
        titulo: `Mensaje de ${user.name}`,
        mensaje: message,
        userId: recipientId, // El destinatario
        entityId: user.id, // El remitente
        leida: false
      }
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
