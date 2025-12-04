import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrioritizedTasks } from '@/lib/task-prioritization-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/prioritized
 * Get all prioritized tasks sorted by priority score
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

    const { searchParams } = new URL(req.url);
    const includeAllUsers = searchParams.get('all') === 'true';

    // Get prioritized tasks
    const tasks = await getPrioritizedTasks(companyId, includeAllUsers ? undefined : userId);

    // Group by priority level
    const grouped = {
      critical: tasks.filter((t) => t.priorityScore.level === 'critical'),
      high: tasks.filter((t) => t.priorityScore.level === 'high'),
      medium: tasks.filter((t) => t.priorityScore.level === 'medium'),
      low: tasks.filter((t) => t.priorityScore.level === 'low'),
    };

    return NextResponse.json({
      tasks,
      grouped,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching prioritized tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas priorizadas' },
      { status: 500 }
    );
  }
}
