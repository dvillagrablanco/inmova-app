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

// Shared logs storage
const syncLogs: SyncLog[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    // Simulate a sync execution
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Generate random results for demo
    const registrosCreados = Math.floor(Math.random() * 10);
    const registrosActualizados = Math.floor(Math.random() * 15);
    const errores = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;
    
    const estado = errores > 2 ? 'FALLIDA' : errores > 0 ? 'PARCIAL' : 'EXITOSA';

    const newLog: SyncLog = {
      id: `log-${Date.now()}`,
      connectionId: id,
      connectionName: 'Sincronización',
      tipo: 'BIDIRECCIONAL',
      estado,
      registrosCreados,
      registrosActualizados,
      registrosEliminados: 0,
      errores,
      duracion,
      mensaje: estado === 'EXITOSA' 
        ? 'Sincronización completada exitosamente' 
        : errores > 2 
          ? 'Error de conexión con el servidor' 
          : 'Sincronización parcial con algunos errores',
      detalles: errores > 0 ? ['Algunos registros no pudieron ser procesados'] : undefined,
      ejecutadoEn: new Date().toISOString(),
    };

    syncLogs.unshift(newLog);

    // Keep only last 100 logs
    if (syncLogs.length > 100) {
      syncLogs.splice(100);
    }

    return NextResponse.json({ 
      data: newLog,
      message: 'Sincronización ejecutada' 
    });
  } catch (error) {
    console.error('[Sync Run Error]:', error);
    return NextResponse.json({ error: 'Error al ejecutar sincronización' }, { status: 500 });
  }
}
