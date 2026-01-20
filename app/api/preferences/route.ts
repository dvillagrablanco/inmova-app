export const dynamic = 'force-dynamic';

/**
 * API: Preferencias de Usuario
 * GET: Obtener preferencias
 * PUT: Actualizar preferencias
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getUserPreferences,
  updateUserPreferences,
  changeExperienceLevel,
  getModuleUsageStats
} from '@/lib/user-preferences-service';
import { z } from 'zod';

import logger from '@/lib/logger';
// GET: Obtener preferencias
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
    const includeStats = searchParams.get('stats') === 'true';

    const prefs = await getUserPreferences(session.user.id);

    const response: any = {
      success: true,
      preferences: prefs
    };

    if (includeStats) {
      response.stats = await getModuleUsageStats(session.user.id);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error('Error obteniendo preferencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar preferencias
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const schema = z.object({
      experienceLevel: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
      theme: z.enum(['light', 'dark']).optional(),
      language: z.enum(['es', 'en']).optional(),
      enableTooltips: z.boolean().optional(),
      enableChatbot: z.boolean().optional(),
      enableVideos: z.boolean().optional(),
      autoplayTours: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
      adjustModulesOnExperienceChange: z.boolean().optional()
    });

    const body = await request.json();
    const updates = schema.parse(body);

    // Si se cambia el nivel de experiencia y adjustModulesOnExperienceChange es true
    if (updates.experienceLevel && updates.adjustModulesOnExperienceChange) {
      const result = await changeExperienceLevel(
        session.user.id,
        updates.experienceLevel,
        true
      );

      if (!result.success) {
        return NextResponse.json(
          { error: 'Error cambiando nivel de experiencia' },
          { status: 400 }
        );
      }

      // Remover el flag del objeto updates
      const { adjustModulesOnExperienceChange, ...restUpdates } = updates;

      // Actualizar el resto de preferencias
      const prefs = await updateUserPreferences(session.user.id, restUpdates);

      return NextResponse.json({
        success: true,
        preferences: prefs,
        message: 'Preferencias actualizadas y módulos ajustados',
        activeModules: result.activeModules
      });
    }

    // Actualización normal de preferencias
    const { adjustModulesOnExperienceChange, ...restUpdates } = updates;
    const prefs = await updateUserPreferences(session.user.id, restUpdates);

    return NextResponse.json({
      success: true,
      preferences: prefs,
      message: 'Preferencias actualizadas'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error actualizando preferencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
