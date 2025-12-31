export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET - Obtener lista de conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true, name: true, role: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    // Obtener todos los usuarios de la empresa (posibles conversaciones)
    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        id: { not: user.id } // Excluir al usuario actual
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    // Para cada usuario, obtener el último mensaje (si existe)
    const conversations = await Promise.all(
      users.map(async (otherUser) => {
        const lastMessage = await prisma.notification.findFirst({
          where: {
            companyId: user.companyId,
            tipo: 'info', // Usamos 'info' para mensajes de chat
            OR: [
              { userId: otherUser.id, entityId: user.id },
              { userId: user.id, entityId: otherUser.id }
            ]
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            titulo: true,
            mensaje: true,
            leida: true,
            createdAt: true,
            userId: true
          }
        });

        const unreadCount = await prisma.notification.count({
          where: {
            companyId: user.companyId,
            tipo: 'info',
            userId: user.id,
            entityId: otherUser.id,
            leida: false
          }
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount
        };
      })
    );

    // Ordenar por fecha del último mensaje (más reciente primero)
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}
