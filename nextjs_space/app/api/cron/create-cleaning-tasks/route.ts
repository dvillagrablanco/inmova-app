import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { autoCreateCleaningTasks } from '@/lib/cron-service';

/**
 * API Route: Creación automática de tareas de limpieza
 * POST /api/cron/create-cleaning-tasks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const companyId = body.companyId || session.user.companyId;

    console.log(`[API] Creando tareas de limpieza automáticas para empresa: ${companyId}`);

    const result = await autoCreateCleaningTasks(companyId);

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Tareas creadas: ${result.itemsProcessed}`
        : 'Creación completada con errores',
      data: result
    });
  } catch (error) {
    console.error('[API] Error en creación de tareas:', error);
    return NextResponse.json(
      { 
        error: 'Error en creación de tareas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
