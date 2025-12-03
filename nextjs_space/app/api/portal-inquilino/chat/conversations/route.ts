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

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    // Get conversations
    const conversations = await prisma.chatConversation.findMany({
      where: {
        tenantId: tenant.id,
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

    // Count unread for each
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderType: 'user',
            leido: false,
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error: any) {
    logger.error('Error fetching tenant conversations:', error);
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

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    const { asunto, mensaje } = await request.json();

    if (!asunto || !mensaje) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Create conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        companyId: tenant.companyId,
        tenantId: tenant.id,
        asunto,
        ultimoMensaje: mensaje,
        ultimoMensajeFecha: new Date(),
      },
    });

    // Create first message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'tenant',
        senderId: tenant.id,
        mensaje,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    logger.error('Error creating tenant conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
