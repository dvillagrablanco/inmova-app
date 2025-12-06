/**
 * API para actualizar progreso de tarea
 * PATCH /api/str-advanced/housekeeping/update-progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateCleaningProgress } from '@/lib/str-advanced-service';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { taskId, completedItems, photos } = body;

    if (!taskId || !completedItems) {
      return NextResponse.json(
        { error: 'taskId y completedItems son requeridos' },
        { status: 400 }
      );
    }

    const task = await updateCleaningProgress(taskId, completedItems, photos);

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error actualizando progreso:', error);
    return NextResponse.json(
      { error: error.message || 'Error actualizando progreso' },
      { status: 500 }
    );
  }
}
