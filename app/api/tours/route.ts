export const dynamic = 'force-dynamic';

/**
 * API: Gestión de Tours Virtuales
 * GET: Obtener tours disponibles
 * POST: Marcar tour como completado/resetear
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getUserPreferences,
  completeTour,
  resetTour
} from '@/lib/user-preferences-service';
import {
  ALL_VIRTUAL_TOURS,
  getToursForUser,
  getNextTour,
  calculateTourProgress
} from '@/lib/virtual-tours-system';
import { z } from 'zod';

// GET: Obtener tours
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'available'; // available | all | next | completed

    const prefs = await getUserPreferences(session.user.id);
    const completedTourIds = prefs.completedTours;
    const activeModules = prefs.activeModules;

    const relevantTours = getToursForUser(
      session.user.role,
      session.user.vertical || 'alquiler_tradicional',
      prefs.experienceLevel,
      activeModules
    );

    let response: any = {
      success: true,
      experienceLevel: prefs.experienceLevel,
      // IMPORTANTE: Devolver el array completo, no solo el length
      completedTours: completedTourIds,
      completedCount: completedTourIds.length
    };

    switch (view) {
      case 'available':
        // Tours pendientes
        const pendingTours = relevantTours.filter(tour => {
          if (!tour.repeatable && completedTourIds.includes(tour.id)) {
            return false;
          }
          return true;
        });
        response.tours = pendingTours;
        response.total = pendingTours.length;
        response.progress = calculateTourProgress(completedTourIds, relevantTours.length);
        break;

      case 'next':
        // Siguiente tour a mostrar
        const nextTour = getNextTour(
          completedTourIds,
          session.user.role,
          session.user.vertical || 'alquiler_tradicional',
          prefs.experienceLevel,
          activeModules
        );
        response.tour = nextTour;
        response.hasNext = !!nextTour;
        break;

      case 'completed':
        // Tours completados
        const completed = ALL_VIRTUAL_TOURS.filter(tour =>
          completedTourIds.includes(tour.id)
        );
        response.tours = completed;
        response.total = completed.length;
        break;

      default: // 'all'
        response.tours = relevantTours;
        response.total = relevantTours.length;
        response.completed = completedTourIds.length;
        response.progress = calculateTourProgress(completedTourIds, relevantTours.length);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error obteniendo tours:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Completar/resetear tour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const schema = z.object({
      action: z.enum(['complete', 'reset']),
      tourId: z.string().min(1)
    });

    const body = await request.json();
    const { action, tourId } = schema.parse(body);

    let result;
    if (action === 'complete') {
      result = await completeTour(session.user.id, tourId);
    } else {
      result = await resetTour(session.user.id, tourId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error procesando acción' },
        { status: 400 }
      );
    }

    const tour = ALL_VIRTUAL_TOURS.find(t => t.id === tourId);

    return NextResponse.json({
      success: true,
      action,
      tourId,
      completedTours: result.completedTours,
      message: action === 'complete'
        ? `Tour "${tour?.name}" completado`
        : `Tour "${tour?.name}" reseteado`
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error gestionando tour:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
