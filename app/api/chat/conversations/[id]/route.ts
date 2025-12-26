import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: params.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Get tenant info
    let tenantInfo: any = null;
    if (conversation.tenantId) {
      tenantInfo = await prisma.tenant.findUnique({
        where: { id: conversation.tenantId },
        select: {
          nombreCompleto: true,
          email: true,
          telefono: true,
        },
      });
    }

    return NextResponse.json({
      conversation: {
        ...conversation,
        tenantInfo,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar conversación' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { estado } = await request.json();

    const conversation = await prisma.chatConversation.update({
      where: { id: params.id },
      data: {
        estado,
        ...(estado === 'cerrada' && {
          cerradoPor: session.user.id,
          fechaCierre: new Date(),
        }),
      },
    });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    logger.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar conversación' },
      { status: 500 }
    );
  }
}
