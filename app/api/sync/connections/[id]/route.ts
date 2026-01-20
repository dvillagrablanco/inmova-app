import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

// Nota: En producción, estos datos deberían almacenarse en la base de datos
// Actualmente no existe un modelo SyncConnection en Prisma

interface SyncConnection {
  id: string;
  companyId: string;
  nombre: string;
  tipo: string;
  plataforma: string;
  estado: string;
  frecuencia: string;
  ultimaSincronizacion?: string;
  proximaSincronizacion?: string;
  registrosSincronizados: number;
  erroresUltimaSinc: number;
  direccion: string;
  entidadesSincronizadas: string[];
  configuracion?: {
    apiKey?: string;
    apiUrl?: string;
    webhookUrl?: string;
  };
  notas?: string;
  createdAt: string;
}

// Almacenamiento en memoria compartido
const syncConnections: SyncConnection[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const connection = syncConnections.find((conn) => conn.id === id);

    if (!connection) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: connection });
  } catch (error) {
    logger.error('[Sync Connection GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener conexión' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const connectionIndex = syncConnections.findIndex((conn) => conn.id === id);

    if (connectionIndex === -1) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    // Actualizar conexión
    const updatedConnection = {
      ...syncConnections[connectionIndex],
      ...body,
      configuracion: body.configuracion || syncConnections[connectionIndex].configuracion,
    };

    syncConnections[connectionIndex] = updatedConnection;

    return NextResponse.json({ data: updatedConnection });
  } catch (error) {
    logger.error('[Sync Connection PUT Error]:', error);
    return NextResponse.json({ error: 'Error al actualizar conexión' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const connectionIndex = syncConnections.findIndex((conn) => conn.id === id);

    if (connectionIndex === -1) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    syncConnections.splice(connectionIndex, 1);

    return NextResponse.json({ message: 'Conexión eliminada exitosamente' });
  } catch (error) {
    logger.error('[Sync Connection DELETE Error]:', error);
    return NextResponse.json({ error: 'Error al eliminar conexión' }, { status: 500 });
  }
}
