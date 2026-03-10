import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock messages per entity
const MOCK_MESSAGES: Record<string, Record<string, Array<{ id: string; autorId: string; autorNombre: string; contenido: string; createdAt: string }>>> = {};

function getMockMessages(entityType: string, entityId: string) {
  const key = `${entityType}:${entityId}`;
  if (!MOCK_MESSAGES[entityType]) MOCK_MESSAGES[entityType] = {};
  if (!MOCK_MESSAGES[entityType][entityId]) {
    MOCK_MESSAGES[entityType][entityId] = [
      {
        id: `msg-${entityId}-1`,
        autorId: 'user-1',
        autorNombre: 'Admin',
        contenido: 'Incidencia registrada correctamente. Revisaremos el caso.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: `msg-${entityId}-2`,
        autorId: 'user-2',
        autorNombre: 'Técnico',
        contenido: 'He revisado el reporte. Se ha programado una visita.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: `msg-${entityId}-3`,
        autorId: 'user-1',
        autorNombre: 'Admin',
        contenido: 'Gracias por la actualización.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }
  return MOCK_MESSAGES[entityType][entityId];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType y entityId son requeridos' },
        { status: 400 }
      );
    }

    const rawMessages = getMockMessages(entityType, entityId);
    const messages = rawMessages.map((m) => ({
      id: m.id,
      entityType,
      entityId,
      autorId: m.autorId,
      autorNombre: m.autorNombre,
      contenido: m.contenido,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API chat/entity GET]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, contenido } = body;

    if (!entityType || !entityId || !contenido || typeof contenido !== 'string') {
      return NextResponse.json(
        { error: 'entityType, entityId y contenido son requeridos' },
        { status: 400 }
      );
    }

    const trimmed = contenido.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    const nuevo = {
      id: `msg-${entityId}-${Date.now()}`,
      entityType,
      entityId,
      autorId: session.user.id || 'user-1',
      autorNombre: session.user.name || session.user.email || 'Usuario',
      contenido: trimmed,
      createdAt: new Date().toISOString(),
    };

    if (!MOCK_MESSAGES[entityType]) MOCK_MESSAGES[entityType] = {};
    if (!MOCK_MESSAGES[entityType][entityId]) {
      MOCK_MESSAGES[entityType][entityId] = [];
    }
    MOCK_MESSAGES[entityType][entityId].push(nuevo);

    return NextResponse.json(nuevo);
  } catch (error) {
    console.error('[API chat/entity POST]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
