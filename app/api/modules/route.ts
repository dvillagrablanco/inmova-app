export const dynamic = 'force-dynamic';

/**
 * API: Gestión de Módulos Activos del Usuario
 * GET: Obtener módulos disponibles y activos
 * POST: Activar/desactivar módulos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  getUserPreferences,
  activateModule,
  deactivateModule
} from '@/lib/user-preferences-service';
import { 
  MODULES,
  getAvailableModules,
  getRecommendedModules,
  getSuggestedModules,
  getModulesByCategory
} from '@/lib/modules-management-system';
import { z } from 'zod';

// GET: Obtener información de módulos
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
    const view = searchParams.get('view') || 'all'; // all | active | available | recommended | suggested

    const prefs = await getUserPreferences(session.user.id);
    const activeModuleIds = prefs.activeModules;

    // Obtener datos de módulos activos
    const activeModules = activeModuleIds.map(id => MODULES[id]).filter(Boolean);

    let response: any = {
      success: true,
      activeModules,
      experienceLevel: prefs.experienceLevel
    };

    switch (view) {
      case 'active':
        response.modules = activeModules;
        break;

      case 'available':
        const available = getAvailableModules(
          session.user.role,
          session.user.vertical || 'alquiler_tradicional',
          activeModuleIds
        );
        response.modules = available;
        break;

      case 'recommended':
        const recommendedIds = getRecommendedModules(
          session.user.role,
          session.user.vertical || 'alquiler_tradicional',
          prefs.experienceLevel
        );
        response.modules = recommendedIds.map(id => MODULES[id]).filter(Boolean);
        break;

      case 'suggested':
        const suggested = getSuggestedModules(
          activeModuleIds,
          session.user.role,
          session.user.vertical || 'alquiler_tradicional'
        );
        response.modules = suggested;
        response.message = suggested.length > 0 
          ? `Encontramos ${suggested.length} módulos que podrían interesarte`
          : 'Ya tienes activos todos los módulos recomendados';
        break;

      case 'categories':
        response.categories = {
          core: getModulesByCategory('core'),
          advanced: getModulesByCategory('advanced'),
          specialized: getModulesByCategory('specialized'),
          premium: getModulesByCategory('premium')
        };
        break;

      default: // 'all'
        response.allModules = Object.values(MODULES);
        response.modulesByCategory = {
          core: getModulesByCategory('core'),
          advanced: getModulesByCategory('advanced'),
          specialized: getModulesByCategory('specialized'),
          premium: getModulesByCategory('premium')
        };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error obteniendo módulos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Activar/desactivar módulo
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
      action: z.enum(['activate', 'deactivate']),
      moduleId: z.string().min(1)
    });

    const body = await request.json();
    const { action, moduleId } = schema.parse(body);

    let result;
    if (action === 'activate') {
      result = await activateModule(session.user.id, moduleId);
    } else {
      result = await deactivateModule(session.user.id, moduleId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Obtener módulos activos actualizados con sus datos completos
    const activeModules = result.activeModules?.map(id => MODULES[id]).filter(Boolean);

    return NextResponse.json({
      success: true,
      action,
      moduleId,
      activeModules,
      message: action === 'activate' 
        ? `Módulo "${MODULES[moduleId]?.name}" activado`
        : `Módulo "${MODULES[moduleId]?.name}" desactivado`
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error gestionando módulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
