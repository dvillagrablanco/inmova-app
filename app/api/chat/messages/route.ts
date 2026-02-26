import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * Verifica que el usuario tiene acceso a la conversación vía companyId scope.
 */
async function verifyConversationAccess(prisma: any, conversationId: string, session: any): Promise<boolean> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { companyId: true },
  });

  if (!conversation) return false;

  // Super admin can access all
  if (session.user.role === 'super_admin') return true;

  // Check company scope (includes child companies for groups)
  const { resolveCompanyScope } = await import('@/lib/company-scope');
  const scope = await resolveCompanyScope({
    userId: session.user.id,
    role: session.user.role,
    primaryCompanyId: session.user.companyId,
    request: null as any,
  });

  return scope.scopeCompanyIds.includes(conversation.companyId);
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
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

    // Security: verify company access
    const hasAccess = await verifyConversationAccess(prisma, conversationId, session);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read (if from tenant/external)
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderType: { not: 'user' },
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
  const prisma = await getPrisma();
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

    // Security: verify company access
    const hasAccess = await verifyConversationAccess(prisma, conversationId, session);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 });
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
