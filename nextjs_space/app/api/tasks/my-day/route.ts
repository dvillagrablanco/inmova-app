import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMyDayTasks, getTaskStats } from '@/lib/task-prioritization-service';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/my-day
 * Get prioritized tasks for "My Day" view
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id: userId, companyId } = session.user;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId no encontrado' }, { status: 400 });
    }

    // Get My Day tasks
    const myDayTasks = await getMyDayTasks(userId, companyId);

    // Get task statistics
    const stats = await getTaskStats(companyId, userId);

    return NextResponse.json({
      tasks: myDayTasks,
      stats,
      count: myDayTasks.length,
    });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error fetching My Day tasks'), {
      context: 'GET /api/tasks/my-day',
      userId,
      companyId,
    });
    return NextResponse.json(
      { error: 'Error al obtener tareas de Mi Día' },
      { status: 500 }
    );
  }
}
