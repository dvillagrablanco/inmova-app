import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

// Nota: En producción, estos datos deberían almacenarse en la base de datos
// Actualmente no existe un modelo SyncConnection en Prisma
// Las conexiones se almacenan en memoria durante la sesión del servidor

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

// Almacenamiento en memoria (se resetea cuando el servidor reinicia)
const syncConnections: SyncConnection[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    // Filtrar conexiones por empresa
    const companyConnections = syncConnections.filter(
      (conn) => conn.companyId === companyId
    );

    return NextResponse.json({ data: companyConnections });
  } catch (error) {
    logger.error('[Sync Connections GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.nombre || !body.plataforma) {
      return NextResponse.json(
        { error: 'Nombre y plataforma son requeridos' },
        { status: 400 }
      );
    }

    const newConnection: SyncConnection = {
      id: `conn-${Date.now()}`,
      companyId,
      nombre: body.nombre,
      tipo: body.tipo || 'API_EXTERNA',
      plataforma: body.plataforma,
      estado: 'ACTIVO',
      frecuencia: body.frecuencia || 'DIARIO',
      registrosSincronizados: 0,
      erroresUltimaSinc: 0,
      direccion: body.direccion || 'BIDIRECCIONAL',
      entidadesSincronizadas: body.entidadesSincronizadas || [],
      configuracion: body.configuracion || {},
      notas: body.notas || '',
      createdAt: new Date().toISOString(),
    };

    syncConnections.push(newConnection);

    return NextResponse.json({ data: newConnection }, { status: 201 });
  } catch (error) {
    logger.error('[Sync Connections POST Error]:', error);
    return NextResponse.json({ error: 'Error al crear conexión' }, { status: 500 });
  }
}
