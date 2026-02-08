import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

// Nota: En producción, estos logs deberían almacenarse en la base de datos
// Actualmente no existe un modelo SyncLog en Prisma

interface SyncLog {
  id: string;
  connectionId: string;
  connectionName: string;
  tipo: string;
  estado: string;
  registrosCreados: number;
  registrosActualizados: number;
  registrosEliminados: number;
  errores: number;
  duracion: number;
  mensaje?: string;
  detalles?: string[];
  ejecutadoEn: string;
}

// Almacenamiento en memoria (se resetea cuando el servidor reinicia)
const syncLogs: SyncLog[] = [];
const ALLOW_IN_MEMORY = process.env.NODE_ENV !== 'production';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Logs de sincronización no disponibles en producción' },
        { status: 501 }
      );
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredLogs = [...syncLogs];

    // Filtrar por conexión si se especifica
    if (connectionId) {
      filteredLogs = filteredLogs.filter((log) => log.connectionId === connectionId);
    }

    // Ordenar por fecha (más recientes primero)
    filteredLogs.sort(
      (a, b) => new Date(b.ejecutadoEn).getTime() - new Date(a.ejecutadoEn).getTime()
    );

    // Aplicar límite
    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({ data: filteredLogs });
  } catch (error) {
    logger.error('[Sync Logs GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 });
  }
}

// Función para añadir logs (usado internamente)
export function addSyncLog(log: Omit<SyncLog, 'id' | 'ejecutadoEn'>) {
  if (!ALLOW_IN_MEMORY) {
    throw new Error('Logs de sincronización no disponibles en producción');
  }
  const newLog: SyncLog = {
    ...log,
    id: `log-${Date.now()}`,
    ejecutadoEn: new Date().toISOString(),
  };
  syncLogs.unshift(newLog);
  
  // Mantener solo los últimos 100 logs
  if (syncLogs.length > 100) {
    syncLogs.splice(100);
  }
  
  return newLog;
}
