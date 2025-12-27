import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/chatbot/conversations - Obtener conversaciones del inquilino
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el inquilino por email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Obtener conversaciones del inquilino
    const conversations = await prisma.chatbotConversation.findMany({
      where: {
        tenantId: tenant.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Solo el último mensaje para preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    logger.error('Error al obtener conversaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

// POST /api/chatbot/conversations - Crear nueva conversación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tema, idioma = 'es' } = body;

    // Buscar el inquilino por email
    const tenant = await prisma.tenant.findUnique({
      where: { email: session.user.email! }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    // Crear sesión única
    const sessionId = `${tenant.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear conversación
    const conversation = await prisma.chatbotConversation.create({
      data: {
        companyId: tenant.companyId,
        tenantId: tenant.id,
        sessionId,
        idioma,
        tema: tema || 'general',
        estado: 'activa',
        contexto: {
          tenantName: tenant.nombreCompleto,
          tenantEmail: tenant.email,
          startedAt: new Date().toISOString()
        }
      },
      include: {
        messages: true
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    logger.error('Error al crear conversación:', error);
    return NextResponse.json(
      { error: 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
