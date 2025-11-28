import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Get all conversations for this company
    const conversations = await prisma.chatConversation.findMany({
      where: {
        companyId,
        estado: {
          not: 'archivada',
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        ultimoMensajeFecha: 'desc',
      },
    });

    // Get tenant names for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        let tenantName = 'Desconocido';
        if (conv.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: conv.tenantId },
            select: { nombreCompleto: true, email: true },
          });
          if (tenant) {
            tenantName = tenant.nombreCompleto;
          }
        }

        // Count unread messages
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderType: 'tenant',
            leido: false,
          },
        });

        return {
          ...conv,
          tenantName,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar conversaciones' },
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

    const { tenantId, asunto, mensaje } = await request.json();

    if (!tenantId || !asunto || !mensaje) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        companyId,
        tenantId,
        userId,
        asunto,
        ultimoMensaje: mensaje,
        ultimoMensajeFecha: new Date(),
      },
    });

    // Create first message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        senderId: userId,
        mensaje,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
