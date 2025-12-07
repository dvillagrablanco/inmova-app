import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getBrandingConfig,
  updateBrandingConfig,
  BrandingConfigData
} from '@/lib/branding-service';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/branding
 * Obtiene la configuración de branding de la empresa del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const companyId = session?.user?.companyId;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Usuario sin empresa asignada' },
        { status: 400 }
      );
    }

    const config = await getBrandingConfig(companyId);
    
    return NextResponse.json(config);
  } catch (error) {
    logger.error('[API Branding GET] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de branding' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branding
 * Actualiza la configuración de branding de la empresa
 * Solo administradores
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo administradores pueden modificar branding
    if (session.user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden modificar el branding' },
        { status: 403 }
      );
    }

    const companyId = session?.user?.companyId;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Usuario sin empresa asignada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data: BrandingConfigData = body;

    const config = await updateBrandingConfig(companyId, data);
    
    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    logger.error('[API Branding POST] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de branding' },
      { status: 500 }
    );
  }
}
