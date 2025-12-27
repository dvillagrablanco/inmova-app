export const dynamic = 'force-dynamic';

/**
 * API: /api/integrations/[integrationId]
 * GET: Obtener detalles de integración
 * PATCH: Actualizar integración
 * DELETE: Eliminar integración
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { IntegrationManager } from '@/lib/integration-manager';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    integrationId: string;
  };
}

/**
 * GET /api/integrations/[integrationId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id: params.integrationId,
        companyId: session.user.companyId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    const provider = IntegrationManager.getProvider(integration.provider);

    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        providerInfo: provider,
      },
    });
  } catch (error) {
    logger.error('Error getting integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/[integrationId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    // Verificar que la integración pertenece a la empresa
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id: params.integrationId,
        companyId: session.user.companyId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Actualizar estado
    const updated = await IntegrationManager.toggleIntegration(
      params.integrationId,
      enabled
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[integrationId]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que la integración pertenece a la empresa
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id: params.integrationId,
        companyId: session.user.companyId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    await IntegrationManager.deleteIntegration(params.integrationId);

    logger.info(`Integration ${params.integrationId} deleted by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
