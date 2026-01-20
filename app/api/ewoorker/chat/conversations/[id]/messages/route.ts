/**
 * API: Mensajes de conversación eWoorker
 * GET /api/ewoorker/chat/conversations/[id]/messages - Obtener mensajes
 * POST /api/ewoorker/chat/conversations/[id]/messages - Enviar mensaje
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerChat } from '@/lib/ewoorker-chat-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Obtener mensajes de una conversación
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { ewoorkerPerfil: true },
        },
      },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const mensajes = await ewoorkerChat.getMessages(params.id, user.company.ewoorkerPerfil.id, {
      before: before ? new Date(before) : undefined,
      limit,
    });

    return NextResponse.json({
      conversacionId: params.id,
      mensajes,
      count: mensajes.length,
    });
  } catch (error: any) {
    logger.error('[EWOORKER_CHAT_MESSAGES_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  contenido: z.string().min(1).max(5000),
  tipo: z.enum(['TEXT', 'FILE', 'IMAGE']).optional(),
  archivoUrl: z.string().url().optional(),
  archivoNombre: z.string().optional(),
});

/**
 * POST: Enviar mensaje en conversación
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: { ewoorkerPerfil: true },
        },
      },
    });

    if (!user?.company?.ewoorkerPerfil) {
      return NextResponse.json({ error: 'No tienes perfil eWoorker' }, { status: 404 });
    }

    // Obtener participante de la conversación
    const participante = await prisma.ewoorkerParticipanteConversacion.findFirst({
      where: {
        conversacionId: params.id,
        perfilEmpresaId: user.company.ewoorkerPerfil.id,
      },
    });

    if (!participante) {
      return NextResponse.json(
        { error: 'No eres participante de esta conversación' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const mensaje = await ewoorkerChat.sendMessage(
      params.id,
      participante.id,
      validated.contenido,
      validated.tipo || 'TEXT',
      validated.archivoUrl && validated.archivoNombre
        ? { url: validated.archivoUrl, nombre: validated.archivoNombre }
        : undefined
    );

    if (!mensaje) {
      return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 });
    }

    return NextResponse.json({ mensaje }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[EWOORKER_CHAT_MESSAGES_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
