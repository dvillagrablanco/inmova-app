import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// In-memory storage for sync logs
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

// Initialize with demo data
const syncLogs: SyncLog[] = [
  {
    id: 'log-1',
    connectionId: 'conn-1',
    connectionName: 'Sincronización Idealista',
    tipo: 'BIDIRECCIONAL',
    estado: 'EXITOSA',
    registrosCreados: 3,
    registrosActualizados: 12,
    registrosEliminados: 0,
    errores: 0,
    duracion: 2345,
    mensaje: 'Sincronización completada exitosamente',
    ejecutadoEn: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log-2',
    connectionId: 'conn-2',
    connectionName: 'Sincronización Fotocasa',
    tipo: 'EXPORTACION',
    estado: 'PARCIAL',
    registrosCreados: 0,
    registrosActualizados: 8,
    registrosEliminados: 0,
    errores: 2,
    duracion: 1890,
    mensaje: 'Sincronización parcial - 2 registros con errores',
    detalles: [
      'Propiedad ID:123 - Error de validación de imágenes',
      'Propiedad ID:456 - Error de formato de precio',
    ],
    ejecutadoEn: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'log-3',
    connectionId: 'conn-1',
    connectionName: 'Sincronización Idealista',
    tipo: 'BIDIRECCIONAL',
    estado: 'EXITOSA',
    registrosCreados: 5,
    registrosActualizados: 20,
    registrosEliminados: 1,
    errores: 0,
    duracion: 3120,
    mensaje: 'Sincronización completada exitosamente',
    ejecutadoEn: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'log-4',
    connectionId: 'conn-3',
    connectionName: 'CRM HubSpot',
    tipo: 'IMPORTACION',
    estado: 'EXITOSA',
    registrosCreados: 15,
    registrosActualizados: 42,
    registrosEliminados: 0,
    errores: 0,
    duracion: 4560,
    mensaje: 'Contactos sincronizados correctamente',
    ejecutadoEn: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'log-5',
    connectionId: 'conn-2',
    connectionName: 'Sincronización Fotocasa',
    tipo: 'EXPORTACION',
    estado: 'FALLIDA',
    registrosCreados: 0,
    registrosActualizados: 0,
    registrosEliminados: 0,
    errores: 5,
    duracion: 890,
    mensaje: 'Error de conexión con el servidor de Fotocasa',
    detalles: [
      'Timeout al conectar con api.fotocasa.es',
      'Reintentos agotados después de 3 intentos',
    ],
    ejecutadoEn: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredLogs = [...syncLogs];

    // Filter by connection if specified
    if (connectionId) {
      filteredLogs = filteredLogs.filter((log) => log.connectionId === connectionId);
    }

    // Sort by date (most recent first)
    filteredLogs.sort(
      (a, b) => new Date(b.ejecutadoEn).getTime() - new Date(a.ejecutadoEn).getTime()
    );

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({ data: filteredLogs });
  } catch (error) {
    console.error('[Sync Logs GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 });
  }
}
