/**
 * API: /api/integrations
 * GET: Listar integraciones configuradas
 * POST: Guardar nueva integración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { IntegrationManager } from '@/lib/integration-manager';
import { logger } from '@/lib/logger';

/**
 * GET /api/integrations
 * Lista integraciones configuradas de la empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Obtener integraciones de la empresa
    const integrations = await IntegrationManager.getCompanyIntegrations(
      session.user.companyId
    );

    // Filtrar por categoría si se especifica
    const filtered = category
      ? integrations.filter(i => i.category === category)
      : integrations;

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    logger.error('Error getting integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Guardar/actualizar configuración de integración
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, credentials, settings } = body;

    if (!provider || !credentials) {
      return NextResponse.json(
        { error: 'Provider and credentials are required' },
        { status: 400 }
      );
    }

    // Guardar integración
    const integration = await IntegrationManager.saveIntegration({
      companyId: session.user.companyId,
      provider,
      credentials,
      settings,
      userId: session.user.id,
    });

    logger.info(`Integration ${provider} saved by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    logger.error('Error saving integration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
