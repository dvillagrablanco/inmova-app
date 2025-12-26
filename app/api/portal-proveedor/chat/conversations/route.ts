import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-proveedor/chat/conversations
 * Obtiene las conversaciones de chat del proveedor autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Obtener conversaciones
    const conversations = await prisma.providerChatConversation.findMany({
      where: {
        providerId,
        companyId: provider.companyId,
        estado: {
          in: ['activa', 'archivada'],
        },
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        ultimoMensajeFecha: 'desc',
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/chat/conversations',
    });
    return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 });
  }
}

/**
 * POST /api/portal-proveedor/chat/conversations
 * Crea una nueva conversación de chat
 */
export async function POST(request: NextRequest) {
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true, nombre: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { asunto, mensajeInicial } = body;

    // Validar campos requeridos
    if (!asunto || !mensajeInicial) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Crear conversación y primer mensaje en una transacción
    const conversation = await prisma.$transaction(async (tx) => {
      const newConversation = await tx.providerChatConversation.create({
        data: {
          providerId,
          companyId: provider.companyId,
          asunto,
          estado: 'activa',
          ultimoMensaje: mensajeInicial.substring(0, 200),
          ultimoMensajeFecha: new Date(),
          noLeidosGestor: 1,
          noLeidosProveedor: 0,
        },
      });

      await tx.providerChatMessage.create({
        data: {
          conversationId: newConversation.id,
          companyId: provider.companyId,
          remitenteProveedor: true,
          remitenteId: providerId,
          remitenteNombre: provider.nombre || 'Proveedor',
          mensaje: mensajeInicial,
          leido: false,
        },
      });

      return newConversation;
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/portal-proveedor/chat/conversations',
    });
    return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 });
  }
}
