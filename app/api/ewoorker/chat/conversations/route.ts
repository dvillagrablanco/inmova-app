/**
 * API: Conversaciones de chat eWoorker
 * GET /api/ewoorker/chat/conversations - Listar conversaciones
 * POST /api/ewoorker/chat/conversations - Crear conversación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ewoorkerChat } from '@/lib/ewoorker-chat-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET: Listar conversaciones del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener perfil ewoorker del usuario
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
    const tipo = searchParams.get('tipo') as 'OBRA' | 'CONTRATO' | 'DIRECTO' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const [conversaciones, stats] = await Promise.all([
      ewoorkerChat.getConversations(user.company.ewoorkerPerfil.id, {
        tipo: tipo || undefined,
        limit,
      }),
      ewoorkerChat.getChatStats(user.company.ewoorkerPerfil.id),
    ]);

    return NextResponse.json({
      conversaciones,
      stats,
    });
  } catch (error: any) {
    console.error('[EWOORKER_CHAT_CONVERSATIONS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const createConversationSchema = z.object({
  tipo: z.enum(['OBRA', 'CONTRATO', 'DIRECTO']),
  obraId: z.string().optional(),
  contratoId: z.string().optional(),
  empresaDestinoId: z.string(),
});

/**
 * POST: Crear o obtener conversación
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = createConversationSchema.parse(body);

    if (validated.tipo === 'OBRA' && validated.obraId) {
      const conversacion = await ewoorkerChat.getOrCreateObraConversation(
        validated.obraId,
        user.company.ewoorkerPerfil.id,
        validated.empresaDestinoId
      );

      if (!conversacion) {
        return NextResponse.json({ error: 'Error creando conversación' }, { status: 500 });
      }

      return NextResponse.json({ conversacion }, { status: 201 });
    }

    // Otros tipos de conversación...
    return NextResponse.json({ error: 'Tipo de conversación no soportado aún' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[EWOORKER_CHAT_CONVERSATIONS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
