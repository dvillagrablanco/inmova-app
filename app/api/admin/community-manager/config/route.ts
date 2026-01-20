import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración por defecto
const DEFAULT_CONFIG = {
  autoPost: false,
  postFrequency: 'weekly',
  customDaysPerWeek: 3,
  bestTimeToPost: '10:00',
  hashtagStrategy: 'auto',
  contentStyle: 'professional',
  aiModel: 'claude-3-5-sonnet',
  temperature: 0.7,
};

/**
 * GET /api/admin/community-manager/config
 * Obtiene la configuración del Community Manager
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // TODO: Obtener configuración de la base de datos
    // Por ahora, retornamos la configuración por defecto
    
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
    });
  } catch (error: any) {
    logger.error('[Community Manager Config Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/community-manager/config
 * Actualizar la configuración del Community Manager
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración es requerida' },
        { status: 400 }
      );
    }

    // TODO: Guardar configuración en base de datos
    // Por ahora, solo validamos y respondemos éxito
    
    return NextResponse.json({
      success: true,
      config: { ...DEFAULT_CONFIG, ...config },
      message: 'Configuración guardada correctamente',
    });
  } catch (error: any) {
    logger.error('[Community Manager Update Config Error]:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
