import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { requireSession } from '@/lib/api-auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-proveedor/chat/messages
 * Obtiene los mensajes de una conversación
 */
export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  const prisma = await getPrisma();
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversacionId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Falta conversacionId' },
        { status: 400 }
      );
    }

    // Verificar que la conversación pertenece al proveedor
    const conversation = await prisma.providerChatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta conversación' },
        { status: 403 }
      );
    }

    // Obtener mensajes
    const messages = await prisma.providerChatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Marcar mensajes del gestor como leídos
    await prisma.providerChatMessage.updateMany({
      where: {
        conversationId,
        remitenteProveedor: false,
        leido: false,
      },
      data: {
        leido: true,
        fechaLeido: new Date(),
      },
    });

    // Resetear contador de no leídos del proveedor
    await prisma.providerChatConversation.update({
      where: { id: conversationId },
      data: {
        noLeidosProveedor: 0,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'GET /api/portal-proveedor/chat/messages',
    });
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal-proveedor/chat/messages
 * Envía un nuevo mensaje en una conversación
 */
export async function POST(request: NextRequest) {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  const prisma = await getPrisma();
  try {
    const providerId = request.headers.get('x-provider-id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { companyId: true, nombre: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { conversacionId, contenido, adjuntos } = body;

    // Validar campos requeridos
    if (!conversacionId || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la conversación existe y pertenece al proveedor
    const conversation = await prisma.providerChatConversation.findUnique({
      where: { id: conversacionId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.providerId !== providerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para enviar mensajes en esta conversación' },
        { status: 403 }
      );
    }

    // Crear mensaje y actualizar conversación en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.providerChatMessage.create({
        data: {
          conversationId: conversacionId,
          companyId: provider.companyId,
          remitenteProveedor: true,
          remitenteId: providerId,
          remitenteNombre: provider.nombre || 'Proveedor',
          mensaje: contenido,
          archivos: adjuntos || [],
          leido: false,
        },
      });

      await tx.providerChatConversation.update({
        where: { id: conversacionId },
        data: {
          ultimoMensaje: contenido.substring(0, 200),
          ultimoMensajeFecha: new Date(),
          noLeidosGestor: {
            increment: 1,
          },
        },
      });

      return message;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'POST /api/portal-proveedor/chat/messages',
    });
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
